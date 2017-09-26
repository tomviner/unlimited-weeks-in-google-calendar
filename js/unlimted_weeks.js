// import { BUTTON_CHECKED, BUTTON_CONTENT, trigger, NavCal, MainCal, Toolbar } from 'gcalendar'

/** Key operations of the extension. */
class UnlimitedWeeks {
    constructor(toolbar, nav_cal, main_cal) {
        this.storage_key = 'gcal-unlim-weeks_num-weeks'
        this.toolbar = toolbar
        this.nav_cal = nav_cal
        this.main_cal = main_cal
    }

    /** add buttons to toolbar and restore the previous number of weeks
      */
    setup() {
        if (this.already_setup === true){
            return
        }
        this.already_setup = true

        this.toolbar.inject_buttons(
            () => this.add_week(),
            () => this.remove_week()
        )

        if (this.toolbar.is_custom_view_active) {
            this.restore_weeks()
        } else {
            this.load_num_weeks().then(num_weeks =>
                this.write_custom_button_label(num_weeks)
            )
        }

        // handle changing back to custom mode from day/week/agenda modes
        this.toolbar.custom_view.click(() => {
            this.restore_weeks()
        })
    }

    add_week() {
        $('.gcal-unlim-weeks-add-week').addClass(BUTTON_CHECKED)
        this.alter_weeks(+1)
    }

    remove_week() {
        $('.gcal-unlim-weeks-remove-week').addClass(BUTTON_CHECKED)
        this.alter_weeks(-1)
    }

    alter_weeks(delta) {
        if (this.toolbar.is_custom_view_active) {
            // simply adjust the number of weeks currently shown
            this.display_weeks(this.main_cal.num_weeks + delta)
        } else {
            if (!this.main_cal.is_active) {
                // probably in agenda mode
                trigger('mousedown mouseup', this.toolbar.custom_view)
            }
            this.load_num_weeks().then(num_weeks =>
                this.display_weeks(num_weeks + delta)
            )
        }
    }

    restore_weeks() {
        this.load_num_weeks().then(num_weeks =>
            this.display_weeks(num_weeks)
        )
    }

    display_weeks(num_weeks) {
        if (num_weeks < 2) {
            num_weeks = 2
        }
        let target_start_day_num = this.main_cal.first_day_num

        // ensure start date is visible in mini cal
        this.nav_cal.navigate_to_day_num(target_start_day_num)

        // do a double manoeuvre: click next month repeatedly during a click drag over
        // the mini calendar.
        // this is how we reach more than one month
        trigger('mousedown', this.get_start_cell())
        let days_remaining = this.allocate_weeks(num_weeks)
        trigger('mousemove mouseup', this.get_end_cell(days_remaining))

        // return main calendar to original start date
        this.move_weeks(target_start_day_num)

        this.write_custom_button_label()
        this.toolbar.custom_view.addClass(BUTTON_CHECKED)
        $('.gcal-unlim-weeks-adjust-weeks').removeClass(BUTTON_CHECKED)

        // preserve number of weeks for next page (re)load
        this.save_num_weeks()
    }

    /** spool forward the mini calendar by `weeks_left` weeks
      * return the number of days remaining
      */
    allocate_weeks(weeks_left) {
        while (weeks_left > 0) {
            let weeks_in_month = this.nav_cal.week_rows_in_month
            if (weeks_in_month > weeks_left) {
                break
            }
            weeks_left -= weeks_in_month
            this.nav_cal.month_forward()
        }
        return Math.max(7 * weeks_left, 0)
    }

    get_start_cell() {
        let index = this.nav_cal.current_month_start_index + 7
        return this.nav_cal.nth(index)
    }

    get_end_cell(days_remaining) {
        let index = days_remaining + this.nav_cal.current_month_start_index
        return this.nav_cal.nth(index)
    }

    /** move the calandar back to the date it started at */
    move_weeks(start_day_num) {
        // move active range forward, out the way
        this.nav_cal.month_forward()
        // we must click outside the active range, otherwise, we just select a single day
        trigger('mousedown mouseup', this.nav_cal.last)

        // now click the date we want, in the mini map
        this.nav_cal.navigate_to_day_num(start_day_num)
        trigger('mousedown mouseup', this.nav_cal.cell_from_day_num(start_day_num))
    }

    write_custom_button_label(num_weeks=null) {
        this.toolbar.custom_view
            .find(`.${BUTTON_CONTENT}`)
            .text(`${num_weeks || this.main_cal.num_weeks} weeks`)
    }


    // persistence methods

    get can_persist() {
        return typeof chrome === 'object' && chrome.storage && chrome.storage.sync
    }

    save_num_weeks() {
        if (this.can_persist) {
            chrome.storage.sync.set({
                [this.storage_key]: this.main_cal.num_weeks
            })
        }
    }

    /** returns a promise */
    load_num_weeks() {
        if (!this.can_persist) {
            return new Promise(resolve => resolve(this.main_cal.num_weeks))
        }
        return new Promise(resolve =>
            chrome.storage.sync.get(this.storage_key, data => {
                if (
                    !$.isEmptyObject(data) &&
                    typeof data[this.storage_key] === 'number' &&
                    data[this.storage_key] >= 1
                ) {
                    return resolve(data[this.storage_key])
                } else {
                    // fallback to counting weeks currently shown
                    // however in day/week/agenda mode main_cal.num_weeks will return 0
                    // so in that case just use a sensible starting number
                    return resolve(this.main_cal.num_weeks || 4)
                }
            })
        )
    }
}


/** See README.md for how this extension works */

let toolbar = new Toolbar()
let nav_cal = new NavCal()
let main_cal = new MainCal()
let unlimited_weeks = new UnlimitedWeeks(
    toolbar=toolbar, nav_cal=nav_cal, main_cal=main_cal)

$(document)
    .on("toolbar_ready", function() {
        unlimited_weeks.setup()
    })

$(document).ready(function() {
    // triggers toolbar_ready event
    toolbar.poll_custom_button_visibility()
})
