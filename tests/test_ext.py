import time

CALENDAR_URL = 'https://calendar.google.com/calendar'
BUTTONS_CLASS = 'gcal-unlim-weeks-adjust-weeks'
ADD_BUTTON_CLASS = 'gcal-unlim-weeks-add-week'
REMOVE_BUTTON_CLASS = 'gcal-unlim-weeks-remove-week'


def get_num_weeks(selenium):
    weeks = selenium.find_elements_by_class_name('month-row')
    return len(weeks)

def inject_extension(selenium):
    # extensions cannot be loaded in headless mode so run scripts directly
    time.sleep(1)
    jquery_js = open('ext/src/inject/jquery.min.js').read()
    selenium.execute_script(jquery_js)
    inject_js = open('ext/src/inject/compiled.min.js').read()
    selenium.execute_script(inject_js)
    time.sleep(1)

def test_load_with_no_button_checked(selenium, authed_get, is_headless):
    # this hash leaves the toolbar without any buttons checked
    no_checked_buttons_url = \
        'https://calendar.google.com/calendar/render#main_7%7Ccustom,28'
    authed_get(no_checked_buttons_url)
    if is_headless:
        inject_extension(selenium)
    ext_buttons = selenium.find_elements_by_class_name(BUTTONS_CLASS)
    assert len(ext_buttons) == 2


def test_ext(selenium, authed_get, is_headless):
    authed_get(CALENDAR_URL)
    if is_headless:
        inject_extension(selenium)

    add_button = selenium.find_element_by_class_name(ADD_BUTTON_CLASS)
    remove_button = selenium.find_element_by_class_name(REMOVE_BUTTON_CLASS)

    # reset to a known state
    # click the custom view button
    selenium.find_elements_by_css_selector(
        '#topRightNavigation .goog-imageless-button')[3].click()
    while get_num_weeks(selenium) > 2:
        remove_button.click()

    old_num_weeks = get_num_weeks(selenium)
    for delta in (1, 2, -3, 1):
        if delta < 0:
            button = remove_button
        else:
            button = add_button
        for _ in range(abs(delta)):
            button.click()
        num_weeks = get_num_weeks(selenium)
        assert num_weeks == old_num_weeks + delta
        old_num_weeks = num_weeks
