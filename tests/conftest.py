import os
import time

import pytest

EXT_PATH = 'ext/'
HEADLESS = True
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
