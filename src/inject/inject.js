function trigger(ename, elem){
    // ename: name of event
    // elem: jQuery element
    if (!elem || elem.length === 0) {
        throw(`Cannot trigger ${ename}, element missing`)
    }
    var evt = document.createEvent("MouseEvents")
    evt.initMouseEvent(ename, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    var dom_elem = elem.get(0)
    dom_elem.dispatchEvent(evt)
}

function trigger_with_jquery(ename, elem){
    $.Event()
    elem[ename]()
}


var start = (n) => $('.dp-cell[class*="dp-o"]').eq(n || 0)
var end = (n) => $('.dp-cell').eq(n || 52)
var custom_view = () => $('#topRightNavigation .goog-imageless-button').eq(3)
var prev_month = () => $('.navBack').eq(0)
var today = () => $('#todayButton\\:1,#todayButton\\:2').children().eq(0)
var next_month = () => $('#dp_0_next')
var selected = () => $('.dp-cell[class*="-selected"]')
var extract_day_num = (el) => parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])
// days since 1st Nov 1950?
selected_day_num = () => extract_day_num(selected())

mini_cal_first_day_num = () => extract_day_num(start())
mini_cal_last_day_num = () => extract_day_num(end())

first_day_num = () => parseInt($('#gridcontainer .month-row span').attr('class').split('ca-cdp').slice(-1)[0])

class MiniCal {
    get cells () {return $('.dp-cell[class*="dp-o"]')}
    get first () {return this.cells.eq(0)}
    get last () {return this.cells.eq(7 * 6 - 1)}
    get selected () {return this.cells.filter('[class*="-selected"]')}
    month_backward () {trigger('mousedown', $('.dp-sb-prev')); trigger('mouseup', $('.dp-sb-prev'))}
    month_forward () {trigger('mousedown', $('.dp-sb-next')); trigger('mouseup', $('.dp-sb-next'))}
    cell_from_day_num (day_num) {return this.cells.filter(`[id$="${day_num}"]`)}
    navigate_to (day_num) {
        var i = 0
        console.log('looking for', day_num, this.cell_from_day_num(day_num))
        while (day_num < mini_cal_first_day_num() || mini_cal_last_day_num() < day_num){
            console.log(mini_cal_first_day_num(), day_num, mini_cal_last_day_num())
            if (++i > 5){
                throw "Too many loops"
            }
            if (day_num < mini_cal_first_day_num()){
                console.log('mini_cal_first_day_num', mini_cal_first_day_num(), '>', day_num)
                console.log('month_backward')
                this.month_backward()
            } else if (mini_cal_last_day_num() < day_num){
                console.log('mini_cal_last_day_num', mini_cal_last_day_num(), '<', day_num)
                console.log('month_forward')
                this.month_forward()
            } else {
                throw 'unknown condition'
            }
        }
        return true
    }

}
mini_cal = new MiniCal()

var set_range = function(months, weeks_to_remove){
    console.log('set_range', months, weeks_to_remove)

    var target_start_day_num = first_day_num()
    console.log('start at day', target_start_day_num)

    days = (7 * (7 - weeks_to_remove)) + 3
    // // go back a couple of months
    prev_month().click()
    prev_month().click()

    // slide range to start today
    trigger('click', today())

    // move to custom view, click doesn't work here
    trigger('mousedown', custom_view())
    trigger('mouseup', custom_view())


    // do a double manoeuvre: click next month during a click drag over the mini calendar.
    // this is how we reach more than one month
    mini_cal.navigate_to(target_start_day_num)
    trigger('mousedown', start())
    // trigger('mousedown', mini_cal.cell_from_day_num(target_start_day_num))
    for (i = 0; i < months; i++) {
        mini_cal.month_forward()
    }
    var end_day = end(days)
    trigger('mousemove', end_day)
    trigger('mouseup', end_day)
    console.log(end_day, end_day.text())

    // rewind the mini-cal to where we began
    for (i = 0; i < months; i++) {
        mini_cal.month_backward()
    }

    // return to selected day
    console.log('return to selected day', target_start_day_num)
    mini_cal.navigate_to(target_start_day_num)
    // trigger('click', today())
}


var num_weeks = 0

function poll_custom_button_visibility(wait_ms=500) {
    var button = custom_view()

    console.log('button', button)

    if (button.is(":visible")) {
        $( document ).trigger("custom_view_buttons_visible")
    } else {
        setTimeout(poll_custom_button_visibility, wait_ms)
    }
  }

function add_buttons(){
    num_weeks = $('.month-row').length
    var button = custom_view()
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

function set_weeks(weeks){
    var weeks_before = $('.month-row').length
    set_range(parseInt(weeks / 4), 4 - weeks % 4)
    var weeks_after = $('.month-row').length
    console.log('want', weeks, 'got', weeks_before, '-->', weeks_after, '(', weeks-weeks_after, ')')
}

function inc_week(){
    set_weeks(++num_weeks)
}

function dec_week(){
    set_weeks(--num_weeks)
}

$(document).ready(
    function(){
        // triggers custom_view_buttons_visible
        poll_custom_button_visibility()

        setTimeout(dec_week, 3000)
    })

// $(document)
//     .on("custom_view_buttons_visible", add_buttons)

$(document)
    .on("custom_view_buttons_visible", function(){
        add_buttons()
        // demo
        setTimeout(inc_week, 1000)
        setTimeout(inc_week, 1500)
        setTimeout(dec_week, 3000)
    })
