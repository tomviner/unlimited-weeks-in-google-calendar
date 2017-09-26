import os
import pytest
import time

from selenium.webdriver.common.keys import Keys

EMAIL = os.environ['GOOGLE_USERNAME']
PASSWORD = os.environ['GOOGLE_PASSWORD']
PHONE = os.environ['GOOGLE_PHONE']
LOGIN_URL = 'https://accounts.google.com/signin'
EXT_PATH = 'ext/'
# turn this on to speed up local development, skipping login
CACHE_AUTH = False


@pytest.fixture(params=[True, False], ids=['headless', 'headed'], autouse=True)
def is_headless(request):
    return request.param


@pytest.fixture
def chrome_options(request, chrome_options, is_headless):
    if CACHE_AUTH:
        profile_dir = request.config.cache.makedir('gcal-unlim-weeks')
        chrome_options.add_argument("user-data-dir={}".format(profile_dir))

    chrome_options.add_argument("--verbose")

    # do not allow popup notifications
    chrome_options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.notifications": 2})
    if is_headless:
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
    else:
        chrome_options.add_argument("--load-extension={}".format(EXT_PATH))
    return chrome_options


@pytest.fixture
def selenium(selenium):
    selenium.implicitly_wait(3)
    return selenium


@pytest.fixture
def authed_get(selenium):
    def authed_getter(url):
        # attempt to get page wanted
        selenium.get(url)

        # if redirected to login form, fill in
        if selenium.current_url.startswith(LOGIN_URL):
            selenium.find_element_by_css_selector(
                '[type=email]').send_keys(EMAIL + Keys.ENTER)
            selenium.find_element_by_css_selector(
                '[type=password][name=password]').send_keys(
                    PASSWORD + Keys.ENTER)
        time.sleep(1)
        if not selenium.current_url.startswith(LOGIN_URL):
            return

        # if further authentication is needed, request verify by phone number
        selenium.find_element_by_xpath('//ul[1]/li[3]').click()
        time.sleep(1)

        phone_input = selenium.find_element_by_id('phoneNumberId')
        phone_input.click()
        phone_input.send_keys(PHONE)
        time.sleep(1)

        nxt = selenium.find_element_by_id('next')
        nxt.click()
        time.sleep(1)

        if not selenium.current_url.startswith(LOGIN_URL):
            return

        # if we're still on the login page, fail here
        # pytest-selenium will take a screenshot
        # and travis-ci's after_failure section will dump that as base64
        assert not selenium.current_url.startswith(LOGIN_URL)

    return authed_getter
