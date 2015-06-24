/*
  Author:  tengattack
  Version: 0.8
  Date:    2015/06/25
*/

function TranslateGPA(score) {
  var trans = [4, 4, 3.99, 3.98, 3.97, 3.95, 3.93, 3.91, 3.88,
   3.85, 3.81, 3.77, 3.73, 3.68, 3.63, 3.58, 3.52, 3.46, 
   3.39, 3.32, 3.25, 3.17, 3.09, 3.01, 2.92, 2.83, 2.73,
    2.63, 2.53, 2.42, 2.31, 2.2, 2.08, 1.96, 1.83, 1.7, 
    1.57, 1.43, 1.29, 1.15, 1, 0];
  return ((score >= 60) ? trans[(100 - Math.floor(score))] : 0);
};

function CalcGPA(terms) {
  var total = 0.0,
    n = 0.0;
  for (var i = 0; i < terms.length; i++) {
    for (var j = 0; j < terms[i].courses.length; j++) {
      var cls = terms[i].courses[j];
      total += TranslateGPA(cls.grade) * cls.credit;
      n += cls.credit;
    }
  }
  return (total / n).toFixed(2);
}

$(document).ready(function () {
  var gpa_table = $('#user_gpa_form table');
  if (!gpa_table || !gpa_table.length) {
    return;
  }
  
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
    
    for (var i = 0; i < lines.length; i++) {
      var tds = $(lines[i]).find('td');
      if (!$(tds[0]).find('input[type="checkbox"]').prop('checked')) {
        continue;
      }
      
      var termname = $(tds[1]).text();
      var courses = find_courses(terms, termname);
      var course = {
        id: $(tds[3]).text(),
        credit: parseFloat($(tds[5]).text()),
        grade: parseFloat($(tds[6]).text())
      };
      courses.push(course);
    }
    
    var gpa = CalcGPA(terms);
    var vgpa = parseFloat(gpa);
    var gr = gpa_table.find('.gpa_result');
    
    gr.text(gpa);
    if (vgpa >= 3) {
      gr.removeClass('fight').addClass('well');
    } else {
      gr.removeClass('well').addClass('fight');
    }
  };
  

  var cbs = gpa_table.find('input[type="checkbox"]');
  // select all
  cbs.prop('checked', true);
  
  var lines = gpa_table.find('tbody tr');
  lines.click(function () {
    var cb = $(this).find('input[type="checkbox"]');
    var c = cb.prop('checked');
    cb.prop('checked', !c);
    //recalc
    calc_gpa();
  });
  
  //init calc
  calc_gpa();
});
