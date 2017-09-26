/* jshint esversion: 6 */

// export { BUTTON_CHECKED, BUTTON_CONTENT, trigger, NavCal, MainCal, Toolbar }

const BUTTON_CHECKED = 'goog-imageless-button-checked'
const BUTTON_CONTENT = 'goog-imageless-button-content'


/** Trigger mouse events on jQuery elements.
  * event_names: space separated names of mouse events
  * jq_element: jQuery element
  */
function trigger(event_names, jq_element) {
    if (!event_names || event_names.length === 0) {
        throw (`Cannot trigger events for ${jq_element}, event_names empty`)
    }
    if (!jq_element || jq_element.length === 0) {
        throw (`Cannot trigger ${event_names}, element missing`)
    }
    for (let event_name of event_names.split(' ')) {
        let evt = new MouseEvent(event_name, {bubbles: true})
        let dom_element = jq_element.get(0)
        dom_element.dispatchEvent(evt)
    }
    return jq_element
}


/** Represents the buttons above the big calendar.
  * e.g. Today, Prev, Next, Day, Week, Month, Custom, Agenda.
  */
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
    get is_custom_view_active() {
        return this.custom_view.is(`.${BUTTON_CHECKED}`)
    }

    /** poll visibility of the custom view button
      * then trigger the toolbar_ready event
      */
    poll_custom_button_visibility(wait_ms = 500) {
        if (this.custom_view.is(":visible")) {
            $(document).trigger("toolbar_ready")
        } else {
            setTimeout(w => this.poll_custom_button_visibility(w), wait_ms)
        }
    }

    /** clone the custom view button and apply text and click handler
      */
    make_button(adjustment, text, handler) {
        return this.custom_view
            .clone()
            .addClass('gcal-unlim-weeks-adjust-weeks')
            .addClass(`gcal-unlim-weeks-${adjustment}-week`)
            .find(`.${BUTTON_CONTENT}`)
                .text(text)
            .end()
            .click(handler)
    }

    /** add two extra buttons to the toolbar, for adjusting the number of weeks
      */
    inject_buttons(add_handler, remove_handler) {
        let add_button = this.make_button('add', '+', add_handler)
        let remove_button = this.make_button('remove', '-', remove_handler)

        this.custom_view
            .after(remove_button)
            .after(add_button)

        add_button.add(remove_button)
            .removeClass(BUTTON_CHECKED)
            // replicate existing button behavior
            .mousedown(function(){$(this).addClass('goog-imageless-button-focused')})
            .mouseup(function(){$(this).removeClass('goog-imageless-button-focused')})
            .mouseenter(function(){$(this).addClass('goog-imageless-button-hover')})
            .mouseleave(function(){$(this).removeClass('goog-imageless-button-hover')})

        // prevent buttons getting stuck in clicked position
        this.buttons.mousedown(() =>
            this.buttons.removeClass(BUTTON_CHECKED)
        )
    }
}


/** Represents the large calendar. */
class MainCal {
    get date_labels() {
        return $('#gridcontainer span[class^="ca-cdp"]')
    }
    get is_active() {
        return this.date_labels.is(':visible')
    }

    /** Google Calendar labels each day with a number as follows:
      * 512 * (year - 1970) + 32 * month + day
      * (assuming 1-indexed months and days)
      * we call this the "day_num"
      */
    get first_day_num() {
        if (!this.is_active) {
            // no grid, must be in agenda mode
            throw("do not call this method while in agenda mode")
        }
        return this.extract_day_num(this.date_labels)
    }
    extract_day_num(el) {
        // i.e. class="ca-cdp24364"
        return parseInt(el.attr('class').split('ca-cdp').slice(-1)[0])
    }

    get num_weeks() {
        return $('.month-row').length
    }
}


/** Represents the small calendar shown at the top left, which is used for
  * navigating and commanding the main calendar. */
class NavCal {
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
    get first_day_num() {
        return this.extract_day_num(this.first)
    }
    get last_day_num() {
        return this.extract_day_num(this.last)
    }
    extract_day_num(el) {
        return parseInt(el.attr('id').split('_').slice(-1)[0])
    }
    /** Return the positions of the 1st day of the current
      * and next months. */
    get month_start_indexes() {
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
    /** current month may start in either first or second row */
    get current_month_starts_high() {
        return this.current_month_start_index < 7
    }
    /** next month may start in either last or penultimate row */
    get next_month_starts_low() {
        return this.next_month_start_index >= 7 * (this.height - 1)
    }
    get week_rows_in_month() {
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
            // prevent infinite loop
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
