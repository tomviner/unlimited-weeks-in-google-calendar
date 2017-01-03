// Written in ECMAScript 6

function poll_custom_button_visibility(wait_ms=500) {
    let button = custom_view()
    console.log('poll_custom_button_visibility', button)
    if (button.is(":visible")) {
        $(document).trigger("custom_view_buttons_visible")
    } else {
        setTimeout(poll_custom_button_visibility, wait_ms)
    }
  }

function inject_buttons(){
    // remove this?
    num_weeks = $('.month-row').length
    let button = custom_view()
    button.after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('-').click(dec_week)
        }
    ).after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('+').click(inc_week)
        }
    )
}

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
        evt.initMouseEvent(event_name, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        let dom_elem = elem.get(0)
        dom_elem.dispatchEvent(evt)
    }
    return elem
}

// let start = () => $('.dp-cell[class*="dp-o"]').eq(0)
// let end = (n) => $('.dp-cell').eq(n || 52)
let month_view = () => $('#topRightNavigation .goog-imageless-button').eq(2)
let custom_view = () => $('#topRightNavigation .goog-imageless-button').eq(3)
let prev_month = () => $('.navBack').eq(0)
let today = () => $('#todayButton\\:1,#todayButton\\:2').children().eq(0)
let next_month = () => $('#dp_0_next')
// let selected = () => $('.dp-cell[class*="-selected"]')
// let extract_day_num = (el) => parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])
// // days since 1st Nov 1950?
// selected_day_num = () => extract_day_num(selected())

// mini_cal_first_day_num = () => extract_day_num(start())
// mini_cal_last_day_num = () => extract_day_num(end())

// BigCal
first_day_num = () => parseInt($('#gridcontainer span[class^="ca-cdp"]').attr('class').split('ca-cdp').slice(-1)[0])

class MiniCal {
    get cells () {return $('.dp-cell[class*="dp-o"]')}
    nth (n) {return this.cells.eq(n)}
    get first () {return this.nth(0)}
    get first_day_num () {return this.extract_day_num(this.first)}
    get last () {return this.nth(7 * 6 - 1)}
    get last_day_num () {return this.extract_day_num(this.last)}
    get month_start_indexs () {return this.cells.map((i, el) => {
            if ($(el).text() === '1'){
                return i
            } else {
                return null
            }
        })
    }
    get weeks_in_month () {
        let [this_starts_at, next_starts_at] = this.month_start_indexs
        // bools get cast to 0 or 1 here. each true is an extra week
        return 4 + (this_starts_at < 7) + (7 * 5 < next_starts_at)
    }
    get selected () {return this.cells.filter('[class*="-selected"]')}
    cell_from_day_num (day_num) {return this.cells.filter(`[id$="${day_num}"]`)}
    extract_day_num (el) {return parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])}
    month_backward () {trigger('mousedown mouseup', $('.dp-sb-prev'))}
    month_forward () {trigger('mousedown mouseup', $('.dp-sb-next'))}
    navigate_to (day_num) {
        let i = 0
        // console.log('looking for', day_num, this.cell_from_day_num(day_num))
        while (day_num < this.first_day_num || this.last_day_num < day_num){
            // console.log(this.first_day_num, day_num, this.last_day_num)
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

function set_range(months, weeks){
    // console.log('set_range', months, weeks)

    let target_start_day_num = first_day_num()
    // console.log('start at day', target_start_day_num)

    let days = 7 * weeks
    // get calandar into known state
    // go back a couple of months
    prev_month().click()
    prev_month().click()
    // slide range to start today
    trigger('click', today())
    // move to month view, click doesn't work here
    trigger('mousedown mouseup', month_view())

    // do a double manoeuvre: click next month during a click drag over the mini calendar.
    // this is how we reach more than one month
    mini_cal.navigate_to(target_start_day_num)
    trigger('mousedown', mini_cal.first)
    // trigger('mousedown', mini_cal.cell_from_day_num(target_start_day_num))
    for (i = 0; i < months; i++) {
        mini_cal.month_forward()
        // weeks_left -= mini_cal.weeks_in_month
    }
    trigger('mousemove mouseup', mini_cal.nth(days))
    trigger('mouseup', mini_cal.nth(days))


    // now move the calandar back to the date it started at
    // console.log('return to selected day', target_start_day_num)
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
    let months_to_set = parseInt((weeks - 1) / 4)
    let weeks_to_set = (weeks - 1) % 4
    set_range(months_to_set, weeks_to_set)
    let weeks_after = $('.month-row').length
    console.log(`set_weeks(${weeks}) --> set_range(${months_to_set}, ${weeks_to_set})`)
    console.log(`got ${weeks_before} -->${weeks_after} (${weeks - weeks_after})`)
    console.log('---')
}

function inc_week(){
    set_weeks(++num_weeks)
}

function dec_week(){
    set_weeks(--num_weeks)
}

let num_weeks = 0
let mini_cal = new MiniCal()

$(document).ready(
    function(){
        // triggers custom_view_buttons_visible event
        poll_custom_button_visibility()
    })

// $(document)
//     .on("custom_view_buttons_visible", inject_buttons)

$(document)
    .on("custom_view_buttons_visible", function(){
        inject_buttons()
        // demo
        setTimeout(inc_week, 1000)
        setTimeout(inc_week, 1500)
        setTimeout(dec_week, 3000)
    })
