/* jshint esversion: 6 */

let BUTTON_CHECKED = 'goog-imageless-button-checked'
let BUTTON_CONTENT = 'goog-imageless-button-content'

function trigger(event_names, elem) {
    // event_names: space sep names of events
    // elem: jQuery element
    if (!event_names || event_names.length === 0) {
        throw (`Cannot trigger ${event_names}, element event_names`)
    }
    if (!elem || elem.length === 0) {
        throw (`Cannot trigger ${event_names}, element missing`)
    }
    for (let event_name of event_names.split(' ')) {
        let evt = document.createEvent("MouseEvents")
        // eek, there's gotta be a better way.
        // replace with https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
        // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
        evt.initMouseEvent(event_name, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        let dom_elem = elem.get(0)
        dom_elem.dispatchEvent(evt)
    }
    return elem
}


class Toolbar {
    get buttons() {
        return $('#topRightNavigation .goog-imageless-button')
    }
    get month_view() {
        return this.buttons.eq(2)
    }
    get custom_view() {
        return this.buttons.eq(3)
    }
    get prev_month() {
        return $('.navBack').eq(0)
    }
    get today() {
        return $('#todayButton\\:1,#todayButton\\:2').children().eq(0)
    }
    get next_month() {
        return $('#dp_0_next')
    }
    get is_custom_view_active() {
        return this.custom_view.is(`.${BUTTON_CHECKED}`)
    }

    poll_custom_button_visibility(wait_ms = 500) {
        if (
            this.custom_view.is(":visible") &&
            this.buttons.filter(`.${BUTTON_CHECKED}`).is(":visible")
        ) {
            $(document).trigger("custom_view_buttons_visible")
        } else {
            setTimeout((w) => this.poll_custom_button_visibility(w), wait_ms)
        }
    }

    inject_buttons() {
        toolbar.custom_view.after(
            function() {
                return $(this)
                    .clone()
                    .addClass('gcal-unlim-weeks-adjust-weeks')
                    .addClass('gcal-unlim-weeks-remove-weeks')
                    .find('.goog-imageless-button-content')
                        .text('-')
                    .end()
                    .click(() => unlimited_weeks.remove_week())

            }
        ).after(
            function() {
                return $(this)
                    .clone()
                    .addClass('gcal-unlim-weeks-adjust-weeks')
                    .addClass('gcal-unlim-weeks-add-weeks')
                    .find('.goog-imageless-button-content')
                        .text('+')
                    .end()
                    .click(() => unlimited_weeks.add_week())
            }
        )

        $('.gcal-unlim-weeks-adjust-weeks')
            .removeClass(BUTTON_CHECKED)
            // replicate button behavior
            .mousedown(function(){$(this).addClass('goog-imageless-button-focused')})
            .mouseup(function(){$(this).removeClass('goog-imageless-button-focused')})
            .mouseenter(function(){$(this).addClass('goog-imageless-button-hover')})
            .mouseleave(function(){$(this).removeClass('goog-imageless-button-hover')})

        if (this.is_custom_view_active) {
            unlimited_weeks.restore_weeks()
        } else {
            unlimited_weeks.load_num_weeks().then(
                function(num_weeks) {
                    unlimited_weeks.write_custom_button_label(num_weeks)
                })
        }

        this.custom_view.click(() => {
            unlimited_weeks.restore_weeks()
        })

        this.buttons.mousedown(() => {
            this.buttons.removeClass(BUTTON_CHECKED)
        })
    }
}

class BigCal {
    get first_day_num() {
        if (!$('#gridcontainer span[class^="ca-cdp"]').is(':visible')) {
            // no grid, must be in agenda mode
            trigger('mousedown mouseup', toolbar.month_view)
        }
        return parseInt(
            // take a fresh look, in case it's only just appeared
            $('#gridcontainer span[class^="ca-cdp"]')
            .attr('class')
            .split('ca-cdp')
            .slice(-1)[0]
        )
    }

    get num_weeks() {
        return $('.month-row').length
    }
}

class MiniCal {
    constructor(height = 6) {
        // in week rows
        this.height = height
    }

    get cells() {
        return $('.dp-cell[class*="dp-o"]')
    }
    nth(n) {
        return this.cells.eq(n)
    }
    get first() {
        return this.nth(0)
    }
    get last() {
        return this.nth(7 * this.height - 1)
    }
    extract_day_num(el) {
        // Google Calendar seems to label each day with a monotonic number
        // that skips in an unknown way
        return parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])
    }
    get first_day_num() {
        return this.extract_day_num(this.first)
    }
    get last_day_num() {
        return this.extract_day_num(this.last)
    }
    get month_start_indexes() {
        // return the positions of the 1st of the current
        // and next months
        return this.cells.map((i, el) => {
            if ($(el).text() === '1') {
                return i
            } else {
                return null
            }
        })
    }
    get current_month_start_index() {
        return this.month_start_indexes[0]
    }
    get next_month_start_index() {
        return this.month_start_indexes[1]
    }
    // current month may start in either first or second row
    get current_month_starts_high() {
        return this.current_month_start_index < 7
    }
    // next month may start in either last or penultimate row
    get next_month_starts_low() {
        return this.next_month_start_index >= 7 * (this.height - 1)
    }
    get weeks_in_month() {
        // bools get cast to 0 or 1 here. each true is an extra week
        return 3 + this.current_month_starts_high + this.next_month_starts_low
    }
    cell_from_day_num(day_num) {
        return this.cells.filter(`[id$="${day_num}"]`)
    }
    month_backward() {
        trigger('mousedown mouseup', $('.dp-sb-prev'))
    }
    month_forward() {
        trigger('mousedown mouseup', $('.dp-sb-next'))
    }
    navigate_to_day_num(day_num) {
        let i = 0
        while (day_num < this.first_day_num || this.last_day_num < day_num) {
            if (++i > 10) {
                throw "Too many iterations"
            }
            if (day_num < this.first_day_num) {
                this.month_backward()
            } else if (this.last_day_num < day_num) {
                this.month_forward()
            } else {
                throw 'unknown condition'
            }
        }
        if (this.cell_from_day_num(day_num).length != 1) {
            throw "target not found on mini cal"
        }
    }
}


class UnlimitedWeeks {
    add_week() {
        $('.gcal-unlim-weeks-add-weeks').addClass(BUTTON_CHECKED)
        this.alter_weeks(+1)
    }

    remove_week() {
        $('.gcal-unlim-weeks-remove-weeks').addClass(BUTTON_CHECKED)
        this.alter_weeks(-1)
    }

    get can_persist() {
        return chrome && chrome.storage && chrome.storage.sync
    }

    save_num_weeks() {
        if (this.can_persist) {
            chrome.storage.sync.set({
                'num_weeks': big_cal.num_weeks
            })
        }
    }

    load_num_weeks() {
        // returns a promise
        if (!this.can_persist) {
            return new Promise((resolve) => resolve(null))
        }
        return new Promise(function(resolve){
            chrome.storage.sync.get('num_weeks', function(data) {
                if (
                    $.isEmptyObject(data) ||
                    typeof data.num_weeks === 'number' ||
                    typeof data.num_weeks >= 2
                ) {
                    return resolve(data.num_weeks)
                } else {
                    return resolve(big_cal.num_weeks)
                }
            })
        })
    }

    restore_weeks() {
        this.load_num_weeks().then(
            num_weeks => this.display_weeks(num_weeks)
        )
    }

    allocate_weeks(weeks_left) {
        while (weeks_left > 0) {
            let weeks_in_month = mini_cal.weeks_in_month
            if (weeks_in_month > weeks_left) {
                break
            }
            weeks_left -= weeks_in_month
            mini_cal.month_forward()
        }
        if (weeks_left > 0) {
            return 7 * weeks_left
        }
        return 0
    }

    get_start_cell() {
        let index = mini_cal.current_month_start_index + 7
        return mini_cal.nth(index)
    }

    get_end_cell(days_remaining) {
        let index = days_remaining + mini_cal.current_month_start_index
        return mini_cal.nth(index)
    }

    move_weeks(start_day_num) {
        // move the calandar back to the date it started at

        // move active range forward, out the way
        mini_cal.month_forward()
        // we must click outside the active range, otherwise, we just select a single day
        trigger('mousedown mouseup', mini_cal.last)

        // now click the date we want, in the mini map
        mini_cal.navigate_to_day_num(start_day_num)
        trigger('mousedown mouseup', mini_cal.cell_from_day_num(start_day_num))
    }

    write_custom_button_label(num_weeks=null) {
        toolbar.custom_view
            .find(`.${BUTTON_CONTENT}`)
            .text(`${num_weeks || big_cal.num_weeks} weeks`)
    }

    alter_weeks(delta) {
        if (toolbar.is_custom_view_active) {
            return this.display_weeks(big_cal.num_weeks + delta)
        }
        let that = this
        this.load_num_weeks().then(function(num_weeks) {
            that.display_weeks(num_weeks + delta)
        })
    }

    display_weeks(weeks_left) {
        if (weeks_left < 2) {
            weeks_left = 2
        }
        let target_start_day_num = big_cal.first_day_num

        // move to custom view, click doesn't work here
        trigger('mousedown mouseup', toolbar.custom_view)

        // ensure start date in visible in mini cal
        mini_cal.navigate_to_day_num(target_start_day_num)

        // do a double manoeuvre: click next month during a click drag over the mini calendar.
        // this is how we reach more than one month
        trigger('mousedown', this.get_start_cell())
        let days_remaining = this.allocate_weeks(weeks_left)
        trigger('mousemove mouseup', this.get_end_cell(days_remaining))

        this.write_custom_button_label()

        this.move_weeks(target_start_day_num)

        // preserve number of weeks for next page (re)load
        this.save_num_weeks()
        toolbar.custom_view.addClass(BUTTON_CHECKED)

        $('.gcal-unlim-weeks-adjust-weeks').removeClass(BUTTON_CHECKED)
    }
}

let demo = false
let mini_cal = new MiniCal()
let big_cal = new BigCal()
let toolbar = new Toolbar()
let unlimited_weeks = new UnlimitedWeeks()


$(document)
    .on("custom_view_buttons_visible", function() {
        toolbar.inject_buttons()
        if (demo === true) {
            console.log('demo')
            setTimeout(unlimited_weeks.add_week, 1000)
            setTimeout(unlimited_weeks.add_week, 1500)
            setTimeout(unlimited_weeks.remove_week, 3000)
        }
    })

$(document).ready(
    function() {
        // triggers custom_view_buttons_visible event
        toolbar.poll_custom_button_visibility()
    })
