
// chrome.extension.sendMessage({}, function(response) {
//     var readyStateCheckInterval = setInterval(function() {
//     if (document.readyState === "complete") {
//         clearInterval(readyStateCheckInterval);

//         // ----------------------------------------------------------
//         // This part of the script triggers when page is done loading
//         console.log("Hello. This message was sent from scripts/inject.js");
//         // ----------------------------------------------------------
// 	}
// 	}, 10);
// });
console.log('start inject script');

function trigger(ename, elem){
    if (!elem) {
        console.log("Cannot " + ename + " element missing");
    }
    console.log("Trigger " + ename + " on " + elem);
    console.log(elem);
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(ename, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    elem.dispatchEvent(evt)
}


var start = function(){
    return $('.dp-today-selected') ||
         $('.dp-onmonth').eq(new Date().getDate()) ||
         $('.dp-cell[class*="dp-o"]');
};

var end = function(n){return $('.dp-cell').eq(n || 52)};
var custom_view = function(){return $('#topRightNavigation .goog-imageless-button:eq(3)')};
var prev_month = function(){return $('.navBack').eq(0)};
var today = function(){return $('#todayButton\\:1,#todayButton\\:2 [role="button"]')};
var next_month = function(){return $('#dp_0_next')};

function error_if_empty(els){
    if (els.length!==1){
        console.log(els);
        console.log(els.length);
        throw(els);
    }
}

var set_range = function(months, weeks_to_remove){
    console.log('set_range', months, weeks_to_remove);
    days = (7 * (7 - weeks_to_remove)) + 3;
    // go back a couple of months
    error_if_empty(prev_month())
    prev_month().click()
    prev_month().click()

    // move to custom view
    error_if_empty(custom_view())
    custom_view().click()

    // slide range to start today
    error_if_empty(today())
    today().click()

    // do a double manoeuvre: click next month during a click drag over the mini calendar.
    // this is how we reach more than one month
    error_if_empty(start())
    error_if_empty(next_month())
    start().mousedown()
    for (i = 0; i < months; i++) {
        next_month().mousedown()
    }
    // end(days).mouseenter()
    error_if_empty(end())
    var end2 = function(n){return document.getElementsByClassName('dp-cell')[n || 52]};
    end(days).mousemove()
    console.log('end', end(days).get(0));
    console.log('end2', end2(days));
    trigger('mousemove', end2(days))
    end(days).mouseup()
    for (i = 0; i < months; i++) {
        prev_month().mousedown()
    }

    today().click()
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.from == "gcal") {
        sendResponse({farewell: "goodbye"});
        set_range(2, 1);
    }
  });

console.log('jQuery', jQuery.fn.jquery)
var num_weeks = 0;

function pollVisibility() {
    var button = $('#topRightNavigation .goog-imageless-button:eq(3)');

    console.log('button', button);

      if (button.is(":visible")) {
          // call a function here, or do whatever now that the div is not visible
          add_buttons(button);
      } else {
          setTimeout(pollVisibility, 500);
      }
  }

function add_buttons(button){
    num_weeks = $('.month-row').length;
    button.after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('-').click(dec_week);
        }
    ).after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('+').click(inc_week).click();
        }
    );
}

function set_weeks(weeks){
    var weeks_before = $('.month-row').length;
    set_range(parseInt(weeks / 4), 4 - weeks % 4);
    var weeks_after = $('.month-row').length;
    console.log('want', weeks, 'got', weeks_before, '-->', weeks_after, '(', weeks-weeks_after, ')')
}

function inc_week(){
    set_weeks(++num_weeks);

}
function dec_week(){
    set_weeks(--num_weeks);
}

jQuery(function($){
    pollVisibility();
});

console.log('end inject script');
