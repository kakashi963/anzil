/**
* Template Name: Kbuses Replica
* File: main.js
*/

(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Sidebar toggle
   */
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function() {
      select('body').classList.toggle('sidebar-toggled')
      select('.sidebar').classList.toggle('d-none')
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Theme Toggle - Dark/Light Mode
   */
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggleWrapper = document.getElementById('theme-toggle-wrapper');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    const applyTheme = (theme) => {
      if (theme === 'dark') {
        body.classList.add('dark-mode');
        if(themeIcon) {
          themeIcon.classList.remove('bi-moon-fill');
          themeIcon.classList.add('bi-sun-fill');
        }
      } else {
        body.classList.remove('dark-mode');
        if(themeIcon) {
          themeIcon.classList.remove('bi-sun-fill');
          themeIcon.classList.add('bi-moon-fill');
        }
      }
    };

    // Apply the saved theme on page load
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      applyTheme(savedTheme);
    }

    const toggleAction = function() {
      const isDarkMode = body.classList.toggle('dark-mode');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      applyTheme(isDarkMode ? 'dark' : 'light');
    };

    if(themeToggleWrapper) {
      themeToggleWrapper.addEventListener('click', toggleAction);
    }
  });

  /**
   * Auto-focus on destination after source selection
   */
  if (document.getElementById('sorc')) {
    document.getElementById('sorc').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (document.getElementById('dest')) {
          document.getElementById('dest').focus();
        }
      }
    });
  }

  /**
   * Search form validation and submission
   */
  var SorsSel = false;
  var DestSel = false;

  function validateInput(input) {
    var regex = /^[\x00-\x7F]*$/;
    return regex.test(input);
  }

  function setSuccessColoursForInput(itemName) {
    $("#" + itemName).css("color", "inherit");
    $("#" + itemName).css("font-weight", "800");
    $("#" + itemName).css("font-family", "'Lato', sans-serif");
    $("#" + itemName).css("border-color", "#0f0");
    $("#msg").html("");
    $("#msg").fadeOut("fast");
  }

  function setFailureColoursForInput(itemName) {
    $("#" + itemName).css("color", "red");
    $("#" + itemName).css("border-color", "red");
    $("#" + itemName).focus();
    $("#msg").html("You need to select a valid stop");
    $("#msg").fadeIn("fast");
    $("#msg").addClass("alert-danger");
  }

  function setLoadingColoursForInput(itemName) {
    $("#" + itemName).css("background", "#f2f3f4 url(assets/img/search_loading.gif) no-repeat 99%");
    $("#" + itemName).css("color", "#e52b50");
  }

  function resetLoadingColoursForInput(itemName) {
    $("#" + itemName).css("background", "inherit");
    $("#" + itemName).css("color", "inherit");
    $("#" + itemName).css("border-color", "none");
  }

  function verifySearch() {
    $('#msg').fadeIn("fast");
    var src = $("#sorc").val();
    var dst = $("#dest").val();
    var tpe = $("#svce").val();
    var tme = $("#time").val();

    SorsSel ? '' : setFailureColoursForInput("sorc");
    DestSel ? '' : setFailureColoursForInput("dest");

    if (src === dst) {
      document.getElementById("msg").innerHTML = "Source and destination cannot be the same";
      document.getElementById("msg").style.display = "block";
      document.getElementById("msg").className = "mt-3 alert alert-danger";
      return false;
    } else if (DestSel === false && SorsSel != true) {
      document.getElementById("msg").innerHTML = "Please enter both source and destination";
      document.getElementById("msg").style.display = "block";
      document.getElementById("msg").className = "mt-3 alert alert-danger";
      return false;
    } else if (DestSel === true && SorsSel != false) {
      $('#msg').removeClass("alert-danger");
      $("#msg").html('Searching..! <div class="progress mt-2"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%;"></div></div>');
      $('#msg').fadeIn("fast");

      var source = $('#sorc').val().replace(/\s+/g, '-').toUpperCase();
      var destination = $('#dest').val().replace(/\s+/g, '-').toUpperCase();

      let plannedJourney = {
        k_source: source,
        k_destination: destination,
        k_bustype: tpe,
        k_timing: tme,
        k_expiry: new Date(new Date().getTime() + 999 * 18)
      };

      localStorage.setItem("plannedJourney", JSON.stringify(plannedJourney));

      // Simulate search - in real app, redirect to results page
      setTimeout(function() {
        $("#msg").html('<div class="alert alert-success"><i class="bi bi-check-circle"></i> Found buses from ' + source + ' to ' + destination + '</div>');
        // Uncomment below for actual navigation
        // window.location.href = 'results.html?source=' + source + '&destination=' + destination + '&type=' + tpe + '&timing=' + tme;
      }, 1500);
    } else {
      return false;
    }
    return false;
  }

  /**
   * Load saved journey from localStorage
   */
  if (localStorage.getItem("plannedJourney") !== null) {
    DestSel = true;
    SorsSel = true;
    let plannedJourney1 = localStorage.getItem("plannedJourney");
    plannedJourney1 = JSON.parse(plannedJourney1);
    let expirationDate = new Date(plannedJourney1.k_expiry);

    if (new Date() > expirationDate) {
      localStorage.removeItem("plannedJourney");
    } else {
      if (document.getElementById('sorc')) {
        document.getElementById('sorc').value = plannedJourney1.k_source;
      }
      if (document.getElementById('dest')) {
        document.getElementById('dest').value = plannedJourney1.k_destination;
      }
      if (document.getElementById('svce')) {
        document.getElementById('svce').value = plannedJourney1.k_bustype;
      }
      if (document.getElementById('time')) {
        document.getElementById('time').value = plannedJourney1.k_timing;
      }
    }
  }

  /**
   * jQuery UI Autocomplete for Source and Destination
   * Note: In production, replace with actual API endpoint
   */
  $(document).ready(function() {
    // Sample data for autocomplete (replace with actual API call)
    var availablePlaces = [
      "Kanjirapally", "Mundakayam", "Erattupetta", "Kottayam",
      "Ernakulam", "Thiruvananthapuram", "Kochi", "Bangalore",
      "Kozhikode", "Thrissur", "Palakkad", "Kollam", "Alappuzha"
    ];

    $("#sorc").autocomplete({
      source: function(req, rsp) {
        setLoadingColoursForInput("sorc");
        SorsSel = false;

        if (validateInput(req.term)) {
          // Filter places based on input
          var matches = $.ui.autocomplete.filter(availablePlaces, req.term);
          resetLoadingColoursForInput("sorc");

          if (matches.length > 0) {
            rsp(matches);
          } else {
            setFailureColoursForInput("sorc");
          }
        } else {
          alert("Please enter in English");
          document.getElementById("sorc").value = "";
        }
      },
      minLength: 2,
      select: function(event, ui) {
        if (ui.item) {
          SorsSel = true;
          setSuccessColoursForInput("sorc");
          $("#dest").focus();
        } else {
          SorsSel = false;
          setFailureColoursForInput("sorc");
        }
      }
    });

    $("#dest").autocomplete({
      source: function(req, rsp) {
        setLoadingColoursForInput("dest");
        DestSel = false;

        if (validateInput(req.term)) {
          var matches = $.ui.autocomplete.filter(availablePlaces, req.term);
          resetLoadingColoursForInput("dest");

          if (matches.length > 0) {
            rsp(matches);
          } else {
            setFailureColoursForInput("dest");
          }
        } else {
          alert("Please enter in English");
          document.getElementById("dest").value = "";
        }
      },
      minLength: 2,
      select: function(event, ui) {
        if (ui.item) {
          DestSel = true;
          setSuccessColoursForInput("dest");
        } else {
          DestSel = false;
          setFailureColoursForInput("dest");
        }
      }
    });

    // Swap locations functionality
    window.swapLoc = function() {
      var src = document.getElementById('sorc').value;
      var dst = document.getElementById('dest').value;
      document.getElementById('sorc').value = dst;
      document.getElementById('dest').value = src;
    }

    // Prevent copy/paste and right-click (optional security feature)
    $('body').bind('cut copy paste', function(e) {
      e.preventDefault();
    });

    $("body").on("contextmenu", function(e) {
      e.preventDefault();
      return false;
    });
  });

  /**
   * Page title scrolling animation (marquee effect for browser title)
   */
  var scrollLock = false;
  var space = " ";
  var speed = "70";
  var pos = -20;
  var msg = "|--- HEARTY WELCOME TO KBUSES ---  KBUSES Home | Bus Timings, Pictures, Route details of all buses passing through Kanjirapally, Mundakayam, Erattupetta and near areas timings on KBUS | www.kbuses.in     ****   www.kbuses.in  ---|";

  function Scroll() {
    if (scrollLock == true) return false;
    document.title = msg.substring(pos, msg.length) + space;
    pos++;
    if (pos > msg.length + 0) pos = -20;
    window.setTimeout("Scroll()", speed);
  }

  // Start scrolling title
  Scroll();

})();
