/*
  Author:  tengattack
  Version: 0.8.1
  Update:  2015/12/18
  Date:    2015/06/25

  Updates:
  * v0.8.1 2015/12/18 add grade5 support in the scores
*/

var FIVE_GRADE_NAMES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function TranslateGPA(score) {
  var trans = [4, 4, 3.99, 3.98, 3.97, 3.95, 3.93, 3.91, 3.88,
   3.85, 3.81, 3.77, 3.73, 3.68, 3.63, 3.58, 3.52, 3.46,
   3.39, 3.32, 3.25, 3.17, 3.09, 3.01, 2.92, 2.83, 2.73,
    2.63, 2.53, 2.42, 2.31, 2.2, 2.08, 1.96, 1.83, 1.7,
    1.57, 1.43, 1.29, 1.15, 1, 0];
    // for those score larger than 100, fix the bug
    if (score > 100){
      score = 100 ;
    }
  return ((score >= 60) ? trans[(100 - Math.floor(score))] : 0);
}

function CalcGPA(terms) {
  var total = 0.0,
    n = 0.0;
  for (var i = 0; i < terms.length; i++) {
    for (var j = 0; j < terms[i].courses.length; j++) {
      var cls = terms[i].courses[j];
      if (FIVE_GRADE_NAMES.indexOf(cls.grade) >= 0) {
        total += TranslateGPA5(cls.grade) * cls.credit;
      } else {
        total += TranslateGPA(cls.grade) * cls.credit;
      }
      n += cls.credit;
    }
  }
  return (total / n).toFixed(2);
}

function TranslateGPA5(grade5) {
  var fls = FIVE_GRADE_NAMES;
  var trans = [4.00, 3.94, 3.85, 3.73, 3.55, 3.32, 3.09, 2.78, 2.42, 2.08, 1.63, 1.15, 0];
  var i = fls.indexOf(grade5);
  if (i < 0) {
    return 0;
  } else {
    return trans[i];
  }
}

function CalcGPA5(terms) {
  var total = 0.0,
    n = 0.0;
  for (var i = 0; i < terms.length; i++) {
    for (var j = 0; j < terms[i].courses.length; j++) {
      var cls = terms[i].courses[j];
      total += TranslateGPA5(cls.grade5) * cls.credit;
      n += cls.credit;
    }
  }
  return (total / n).toFixed(2);
}

function parseScore(sscore) {
  if (/^[0-9\.]+$/.test(sscore)) {
    return parseFloat(sscore);
  } else {
    return sscore;
  }
}

$(document).ready(function () {
  var gpa_table = $('#user_gpa_form table');
  if (!gpa_table || !gpa_table.length) {
    return;
  }

  //make it sortable
  gpa_table.tablesort();

  var cbs = gpa_table.find('input[type="checkbox"]');
  var uihcb = gpa_table.find('thead .ui.checkbox');
  var hcb = uihcb.find('input[type="checkbox"]');
  uihcb.click(function (e) {
    var cb = $(this).find('input[type="checkbox"]');
    var c = cb.prop('checked');
    cb.prop('checked', !c);
    cbs.prop('checked', !c);
    e.stopPropagation();
  });

  var calc_grade5 = function (grade, returnindex) {
    var fls = FIVE_GRADE_NAMES;
    var spgrades = [97, 93, 90, 87, 83, 80, 77, 73, 70, 67, 63, 60];
    for (var i = 0; i < spgrades.length; i++) {
      if (typeof(grade) === 'string') {
        //grade5
        return grade;
      }
      if (grade >= spgrades[i]) {
        return returnindex ? i : fls[i];
      }
    }
    return returnindex ? (fls.length - 1) : fls[fls.length - 1];
  };

  var find_courses = function (terms, name) {
    for (var i = 0; i < terms.length; i++) {
      if (terms[i].name == name) {
        return terms[i].courses;
      }
    }
    var term = {
      name: name,
      courses: []
    };
    terms.push(term);
    return term.courses;
  };

  var calc_gpa = function () {
    var lines = gpa_table.find('tbody tr');
    var terms = [];

    var allselect = true;
    for (var i = 0; i < lines.length; i++) {
      var tds = $(lines[i]).find('td');
      if (!$(tds[0]).find('input[type="checkbox"]').prop('checked')) {
        allselect = false;
        continue;
      }

      var termname = $(tds[1]).text();
      var courses = find_courses(terms, termname);
      var grade = parseScore($(tds[6]).text());
      var course = {
        id: $(tds[3]).text(),
        credit: parseFloat($(tds[5]).text()),
        grade: grade,
        grade5: calc_grade5(grade)
      };
      courses.push(course);
    }
    hcb.prop('checked', allselect);

    var gr = gpa_table.find('tfoot .gpa_result');

    if (terms.length <= 0) {
      gr.text('');
      return;
    }

    var set_gpa = function (grade5, gpa) {
      var vgpa = parseFloat(gpa);
      var sgr = $(gr[grade5 ? 1 : 0]);
      sgr.text(gpa);
      if (vgpa >= 3) {
        sgr.removeClass('fight').addClass('well');
      } else {
        sgr.removeClass('well').addClass('fight');
      }
    };

    var gpa1 = CalcGPA(terms);
    var gpa5 = CalcGPA5(terms);
    set_gpa(0, gpa1);
    set_gpa(1, gpa5);
  };

  var lines = gpa_table.find('tbody tr');
  lines.click(function () {
    var cb = $(this).find('input[type="checkbox"]');
    var c = cb.prop('checked');
    cb.prop('checked', !c);
    //recalc
    calc_gpa();
  });

  //init calc
  for (var i = 0; i < lines.length; i++) {
    var tds = $(lines[i]).find('td');

    //deprecated: not select two level course
    var cb = $(tds[0]).find('input[type="checkbox"]');
    /*var type = $(tds[3]).text(); //or $(tds[2]).text(); == '通选'
    cb.prop('checked', !type.match(/^E\d+$/));*/
    cb.prop('checked', true);

    //calc grade5
    var grade = parseScore($(tds[6]).text());
    var tdgrade5 = $(tds[7]);
    $(tds[7])
      .text(calc_grade5(grade))
      .data('sort-value', calc_grade5(grade, true));
  }

  calc_gpa();
});
