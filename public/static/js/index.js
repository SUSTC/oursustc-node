// // for index
// // ++++++++++++++++++++++++++++++++++++++++++

// !function ($) {

//   var area = $('#bg_album_area');

//   var slider_content = area.find('.slider-wrapper #slider-content');
//   var sliderblock = {
//     linecount: 6,
//     line: 4,
//     width: 157,
//     height: 157
//   };

//   for (var y = 0; y < sliderblock.line; y++) {
//     for (var x = 0; x < sliderblock.linecount; x++) {
//       var background_style = 'background-position: -' + (x * sliderblock.width).toString() + 'px -' + (y * sliderblock.height).toString() + 'px;';
//       var additional_style = '';
//       if (x === sliderblock.linecount - 1) {
//         additional_style = 'width:' + (sliderblock.width - 2).toString() + 'px;';
//       }
//       var cube = slider_content.append('<div class="cube" id="slider_' + x + '_' + y + 
//         '" style="left:' + (x * sliderblock.width).toString() + 'px;top:' + (y * sliderblock.height).toString() + 'px;' + additional_style + '">\
//         <div class="inner_a" style="' + background_style + '"></div><div class="inner_b" style="background-image: url(' + sliderimages[0].source + '); ' + background_style + '"></div>\
//         </div>');
//     }
//   }

//   var slider_feed = area.find('.slider-wrapper #slider-feed');
//   var simple_tbody = $('.simple-wrapper tbody');

//   var slider_nav_ul_html = '';
//   for (var i = 0; i < sliderimages.length; i++) {
//     slider_feed.append('<div class="slide">\
//         <img class="slide_source" alt="" src="' + sliderimages[i].source + '">\
//         <div class="transition">' + sliderimages[i].transition + '</div>\
//         <div class="title">' + sliderimages[i].title + '</div>\
//         <div class="lightbox">' + sliderimages[i].lightbox + '</div>\
//         <div class="link_url">' + sliderimages[i].url + '</div>\
//         <div class="s_description">' + sliderimages[i].description + '</div>\
//       </div>');

//     simple_tbody.append('<tr>\
//         <td><a href="' + sliderimages[i].url + '"><img alt="' + sliderimages[i].title + '" src="' + sliderimages[i].source + '"></a></td>\
//       </tr>');

//     slider_nav_ul_html += '<li' + ((i === 0) ? ' class="slider_nav_active"' : '') + '>' + i + '</li>';
//   }

//   slider_feed.append('<div class="slider-img-count">' + sliderimages.length + '</div>');

//   //slider_content <div class="slider_info_holder">
//   $('.slider_info_holder').append('<div class="info_line"><a href="' + sliderimages[0].url + '" style="opacity: 1; font-size: 48px;">' + sliderimages[0].title + '</a></div>\
//       <div class="clearfix"></div>\
//       <ul class="slider_nav" style="opacity: 1;">' + slider_nav_ul_html + '</ul>\
//     ');

//   $('.main.container').addClass('index');

//    function resize_bg_album() {
//       var w = $(window);
//       var width = w.width();
//       var height = w.height();
//       var bgw = width;
//       var bgh = width * 1050 / 1680;
//       var bwidth = Math.ceil(width / 6);
//       var bheight = bwidth;
//       window.w = bwidth;
//       window.h = bheight;

//       $('#bg_album').css({'width': width, 'height': height});
//       $('#index_album .slider-wrapper').css({'height': bgh});

//       var cubes = $('.cube');
//       var lc = 0;
//       for (var i = 0; i < cubes.length; i++) {
//         var bw = lc % sliderblock.linecount == (sliderblock.linecount - 1) ? bgw - bwidth * (sliderblock.linecount - 1) : bwidth - 1;
//         var bh = parseInt(lc / sliderblock.linecount) == (sliderblock.line - 1) ? bgh - bheight * (sliderblock.line - 1) : bheight - 1;
//         var bl = lc % sliderblock.linecount * bwidth;
//         var bt = parseInt(lc / sliderblock.linecount) * bheight;
//         $(cubes[i]).css({
//           left: bl,
//           top: bt,
//           width: bw,
//           height: bh
//         })
//         .find('div')
//           .css('background-size', bgw + 'px ' + bgh + 'px')
//           .css('background-position', '-' + bl + 'px -' + bt + 'px')
//           .css({width: bw, height: bh});
//         lc++;
//       }
//     }
//     $(window).resize(resize_bg_album);

//     resize_bg_album();

// }(window.jQuery);
