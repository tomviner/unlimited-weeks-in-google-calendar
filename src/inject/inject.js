/* jshint esversion: 6 */

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
            // eek, there's gotta be a better way
        evt.initMouseEvent(event_name, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        let dom_elem = elem.get(0)
        dom_elem.dispatchEvent(evt)
    }
    return elem
}


class Toolbar {
    get month_view() {
        return $('#topRightNavigation .goog-imageless-button').eq(2)
    }
    get custom_view() {
        return $('#topRightNavigation .goog-imageless-button').eq(3)
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

    poll_custom_button_visibility(wait_ms = 500) {
        if (this.custom_view.is(":visible")) {
            $(document).trigger("custom_view_buttons_visible")
        } else {
            setTimeout((w) => this.poll_custom_button_visibility(w), wait_ms)
        }
    }

    inject_buttons() {
        this.custom_view.after(
            function() {
                return $(this)
                    .clone()
                    .removeClass('goog-imageless-button-checked')
                    .text('-')
                    .click(() => unlimited_weeks.remove_week())
            }
        ).after(
            function() {
                return $(this)
                    .clone()
                    .removeClass('goog-imageless-button-checked')
                    .text('+')
                    .click(() => unlimited_weeks.add_week())
            }
        )

        if (this.custom_view.is('.goog-imageless-button-checked')){
            this.restore_weeks()
        }

        this.custom_view.click(this.restore_weeks)
    }

    restore_weeks() {
        chrome.storage.sync.get('num_weeks', function(data) {
            if (data.num_weeks >= 2) {
                unlimited_weeks.set_weeks(data.num_weeks)
            }
        })
    }
}

class BigCal {
    get first_day_num() {
        return parseInt(
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
    constructor(height=6) {
        // in weeks
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
    navigate_to(day_num) {
        let i = 0
        while (day_num < this.first_day_num || this.last_day_num < day_num) {
            if (++i > 10) {
                throw "Too many loops"
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
        this.set_weeks(big_cal.num_weeks + 1)
    }

    remove_week() {
        this.set_weeks(big_cal.num_weeks - 1)
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

    get_start_cell(){
        let index = mini_cal.current_month_start_index + 7
        return mini_cal.nth(index)
    }

    get_end_cell(days_remaining){
        let index = days_remaining + mini_cal.current_month_start_index
        return mini_cal.nth(index)
    }

    set_weeks(weeks_left) {
        let target_start_day_num = big_cal.first_day_num

        // move to custom view, click doesn't work here
        trigger('mousedown mouseup', toolbar.custom_view)

        // ensure start date in visible in mini cal
        mini_cal.navigate_to(target_start_day_num)

        // do a double manoeuvre: click next month during a click drag over the mini calendar.
        // this is how we reach more than one month
        trigger('mousedown', this.get_start_cell())
        let days_remaining = this.allocate_weeks(weeks_left)
        trigger('mousemove mouseup', this.get_end_cell(days_remaining))

        toolbar.custom_view
            .find('.goog-imageless-button-content')
            .text(`${big_cal.num_weeks} weeks`)

        // now move the calandar back to the date it started at

        // move active range forward, out the way
        mini_cal.month_forward()
        // we must click outside the active range, otherwise, we just select a single day
        trigger('mousedown mouseup', mini_cal.last)

        // now click the date we want, in the mini map
        mini_cal.navigate_to(target_start_day_num)
        trigger('mousedown mouseup', mini_cal.cell_from_day_num(target_start_day_num))

        // preserve number of weeks for next page (re)load
        chrome.storage.sync.set({'num_weeks': big_cal.num_weeks})
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
            // demo
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
