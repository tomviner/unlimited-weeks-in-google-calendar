import os
import time

import pytest
from selenium.webdriver.common.keys import Keys

EMAIL = os.environ['GOOGLE_USERNAME']
PASSWORD = os.environ['GOOGLE_PASSWORD']
CALENDAR_URL = 'https://calendar.google.com/calendar'
LOGIN_URL = 'https://accounts.google.com/signin/v2/identifier'
EXT_PATH = 'ext/'
HEADLESS = False
CACHE_AUTH = False


@pytest.fixture
def chrome_options(request, chrome_options):
    if CACHE_AUTH:
        profile_dir = request.config.cache.makedir('gcal-unlim-weeks')
        chrome_options.add_argument("user-data-dir={}".format(profile_dir))

    chrome_options.add_argument("--verbose")

    # do not allow popup notifications
    chrome_options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.notifications": 2})
    if HEADLESS:
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
    else:
        chrome_options.add_argument("--load-extension={}".format(EXT_PATH))
    return chrome_options

@pytest.fixture
def selenium(selenium):
    selenium.implicitly_wait(3)
    return selenium


def authed_get(selenium, url):
    selenium.get(url)
    if selenium.current_url.startswith(LOGIN_URL):
        selenium.find_element_by_css_selector(
            '[type=email]').send_keys(EMAIL + Keys.ENTER)
        selenium.find_element_by_css_selector(
            '[type=password][name=password]').send_keys(PASSWORD + Keys.ENTER)

def get_num_weeks(selenium):
    weeks = selenium.find_elements_by_class_name('month-row')
    return len(weeks)

def test_ext(selenium):
    authed_get(selenium, CALENDAR_URL)

    if HEADLESS:
        # extensions cannot be loaded in headless mode so run scripts directly
        time.sleep(1)
        jquery_js = open('ext/src/inject/jquery.min.js').read()
        selenium.execute_script(jquery_js)
        inject_js = open('ext/src/inject/inject.js').read()
        selenium.execute_script(inject_js)
        time.sleep(1)

    add_button = selenium.find_element_by_class_name(
        'gcal-unlim-weeks-add-week')
    remove_button = selenium.find_element_by_class_name(
        'gcal-unlim-weeks-remove-week')

    # reset to a known state
    selenium.find_elements_by_css_selector(
        '#topRightNavigation .goog-imageless-button')[3].click()
    while get_num_weeks(selenium) > 2:
        remove_button.click()

    num_weeks = get_num_weeks(selenium)
    for delta in (1, 2, -3, 1):
        if delta < 0:
            button = remove_button
        else:
            button = add_button
        for _ in range(abs(delta)):
            button.click()
        old_num_weeks = num_weeks
        num_weeks = get_num_weeks(selenium)
        assert num_weeks == old_num_weeks + delta
