# Unlimited weeks in Google Calendar [![Build Status](https://travis-ci.org/tomviner/unlimited-weeks-in-google-calendar.svg?branch=master)](https://travis-ci.org/tomviner/unlimited-weeks-in-google-calendar)

[![Unlimited weeks in Google Calendar icon](ext/icons/icon-128x128.png)](https://chrome.google.com/webstore/detail/gcal-unlimited-weeks/kppipnjcfidhlpgckimgaifilmkolokj) | [![Chrome Web Store Badge](assets/ChromeWebStore_Badge_v2_340x96.png)](https://chrome.google.com/webstore/detail/gcal-unlimited-weeks/kppipnjcfidhlpgckimgaifilmkolokj)
--- | ---

A Chrome extension to show more than 4 weeks in Google Calendar.

Adds + and - buttons to display as many weeks as your screen can handle.

![plus and minus buttons](assets/buttons.png)

![screenshot](assets/screenshot-1280x800.png)

### How this works:

- wait for the toolbar to be visible
- when it is, add 2 extra buttons to the toobar
- restore the main calendar's number of weeks, if custom view is active
- the click handlers for these new buttons adjust the number of weeks:
    - ensure custom view is active
    - using the navigation calendar, do a double manoeuvre:
        - click next month repeatedly during a click drag over the mini calendar
        - this is how we reach more than one month
    - ensure the main calendar is navigated to the original start date
- use browser storage to persist the number of weeks selected
