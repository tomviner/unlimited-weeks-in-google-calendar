// Written in ECMAScript 6

function trigger(event_names, elem){
    // event_names: space sep names of events
    // elem: jQuery element
    if (!event_names || event_names.length === 0) {
        console.log(elem)
        throw(`Cannot trigger ${event_names}, element event_names`)
    }
    if (!elem || elem.length === 0) {
        console.log(elem)
        throw(`Cannot trigger ${event_names}, element missing`)
    }
    for (let event_name of event_names.split(' ')) {
        let evt = document.createEvent("MouseEvents")
        // eek, there's gotta be a better way!
        evt.initMouseEvent(event_name, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        let dom_elem = elem.get(0)
        dom_elem.dispatchEvent(evt)
    }
    return elem
}


class Toolbar {
    get month_view () {return $('#topRightNavigation .goog-imageless-button').eq(2)}
    get custom_view () {return $('#topRightNavigation .goog-imageless-button').eq(3)}
    get prev_month () {return $('.navBack').eq(0)}
    get today () {return $('#todayButton\\:1,#todayButton\\:2').children().eq(0)}
    get next_month () {return $('#dp_0_next')}

    poll_custom_button_visibility(wait_ms=500) {
        if (this.custom_view.is(":visible")) {
            $(document).trigger("custom_view_buttons_visible")
        } else {
            setTimeout((w) => this.poll_custom_button_visibility(w), wait_ms)
        }
    }

    inject_buttons() {
        num_weeks = $('.month-row').length
        this.custom_view.after(
            function() {
                return $(this).clone().removeClass('goog-imageless-button-checked').text('-').click(dec_week)
            }
        ).after(
            function() {
                return $(this).clone().removeClass('goog-imageless-button-checked').text('+').click(inc_week)
            }
        )
    }
}

class BigCal {
    get first_day_num () {
        return parseInt(
            $('#gridcontainer span[class^="ca-cdp"]')
                .attr('class')
                .split('ca-cdp')
                .slice(-1)[0]
        )
    }
}

class MiniCal {
    get cells () {return $('.dp-cell[class*="dp-o"]')}
    nth(n) {return this.cells.eq(n)}
    get first () {return this.nth(0)}
    get first_day_num () {return this.extract_day_num(this.first)}
    get last () {return this.nth(7 * 6 - 1)}
    get last_day_num () {return this.extract_day_num(this.last)}
    get month_start_indexes () {return this.cells.map((i, el) => {
            if ($(el).text() === '1'){
                return i
            } else {
                return null
            }
        })
    }
    get month_start_cells () {return this.cells.map((i, el) => {
            if ($(el).text() === '1'){
                return $(el)
            } else {
                return null
            }
        })
    }
    get month_starts_high () {return this.month_start_indexes[0] < 7}
    get month_ends_low () {return this.month_start_indexes[1] >= 7 * 5}
    get weeks_in_month () {
        // bools get cast to 0 or 1 here. each true is an extra week
        return 3 + this.month_starts_high + this.month_ends_low
    }
    get selected () {return this.cells.filter('[class*="-selected"]')}
    cell_from_day_num (day_num) {return this.cells.filter(`[id$="${day_num}"]`)}
    extract_day_num (el) {return parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])}
    month_backward () {trigger('mousedown mouseup', $('.dp-sb-prev'))}
    month_forward () {trigger('mousedown mouseup', $('.dp-sb-next'))}
    navigate_to (day_num) {
        let i = 0
        while (day_num < this.first_day_num || this.last_day_num < day_num){
            if (++i > 10){
                throw "Too many loops"
            }
            if (day_num < this.first_day_num){
                this.month_backward()
            } else if (this.last_day_num < day_num){
                this.month_forward()
            } else {
                throw 'unknown condition'
            }
        }
        if (this.cell_from_day_num(day_num).length != 1){
            throw "target not found on mini cal"
        }
    }
}

function set_range(weeks_left){
    let weeks_wanted = weeks_left
    let target_start_day_num = big_cal.first_day_num

    // move to month view, click doesn't work here
    trigger('mousedown mouseup', toolbar.custom_view)

    // ensure start date in visible in mini cal
    mini_cal.navigate_to(target_start_day_num)

    // do a double manoeuvre: click next month during a click drag over the mini calendar.
    // this is how we reach more than one month
    trigger('mousedown', mini_cal.nth(mini_cal.month_start_indexes[0]+7))
    let days = 0
    let i = -1
    while (weeks_left > 0) {
        i++
        console.log(`${weeks_left} weeks left,`)
        let weeks_in_month = mini_cal.weeks_in_month
        if (weeks_in_month > weeks_left){
            console.log(`    < ${weeks_in_month} months - no full months left`)
            break
        }
        weeks_left -= weeks_in_month
        console.log(`    - ${weeks_in_month} weeks_in_month`)
        mini_cal.month_forward()
    }
    if (weeks_left === 0){
        console.log(`    = exactly no weeks_left`)
    }
    else if (weeks_left < 0) {
        throw `Didn't expect ${weeks_left} weeks_left`
    } else if (weeks_left > 0) {
        days = 7 * weeks_left
        console.log(`    + ${days} days left`)
    }
    console.log(`days = ${days}`)
    console.log(`days += ${mini_cal.month_start_indexes[0]} mini_cal.month_start_indexes[0]`)
    days += mini_cal.month_start_indexes[0]

    console.log(`stop on day ${mini_cal.nth(days).text()}`, mini_cal.nth(days))
    trigger('mousemove mouseup', mini_cal.nth(days))
    trigger('mouseup', mini_cal.nth(days))

    let weeks_got = $('.month-row').length
    toolbar.custom_view.find('.goog-imageless-button-content').text(`${weeks_got} weeks`)

    // now move the calandar back to the date it started at
    console.log('return to selected day', target_start_day_num)

    // move active range forward, out the way
    mini_cal.month_forward()
    // we must click outside the active range, otherwise, we just select a single day
    trigger('mousedown mouseup', mini_cal.last)

    // now click the date we want, in the mini map
    mini_cal.navigate_to(target_start_day_num)
    trigger('mousedown mouseup', mini_cal.cell_from_day_num(target_start_day_num))


}

function set_weeks(weeks){
    let weeks_before = $('.month-row').length
    set_range(weeks)
    let weeks_after = $('.month-row').length
    console.log(`set_weeks(${weeks}) --> set_range(${weeks})`)
    console.log(`got ${weeks_before} -->${weeks_after} (${weeks - weeks_after})`)
    console.log('---')
}

function inc_week() {
    set_weeks(++num_weeks)
}

function dec_week() {
    set_weeks(--num_weeks)
}


let demo = true
let num_weeks
let mini_cal = new MiniCal()
let big_cal = new BigCal()
let toolbar = new Toolbar()


if (demo===true){
    $(document)
        .on("custom_view_buttons_visible", toolbar.inject_buttons)
} else {
    $(document)
        .on("custom_view_buttons_visible", function() {
            toolbar.inject_buttons()
            // demo
            setTimeout(inc_week, 1000)
            setTimeout(inc_week, 1500)
            setTimeout(dec_week, 3000)
        })
}

$(document).ready(
    function() {
        // triggers custom_view_buttons_visible event
        toolbar.poll_custom_button_visibility()
    })
