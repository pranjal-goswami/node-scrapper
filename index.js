'use strict';

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var md5 = require('md5');

var sleep = require('sleep');

var q = require('q');

var baseUrl = 'http://www.4icu.org';


var scrape = function(url){

	var hash =  md5(url);
    
    request(url, function(error, response, html){
	
        if(!error){
            var $ = cheerio.load(html);


            // console.log('%s, %s, %s, %s','sno','university','location','link');
            var _flag = true;
            

            $('a.lead').each(function(i,e){


            	var data = {};
            	data.sno = i+1;
            	e = $(e);

            	data.link = baseUrl+e.attr('href');
            	data.university = e.text();

            	data.location = e.parent().siblings().last().text();

                getDeatilsFromPage(data.link,data).then(function(){



                    var ret = '';

                    
                    var keys = '';
                    for(var prop in data){
                        if(_flag) keys+=prop+'\t';

                        if(data.hasOwnProperty(prop)){
                            //data[prop] = (data[prop]+'').replace(/[,]/g,'\\,');
                            ret+= data[prop]+'\t';
                        }

                    }
                    if(_flag) console.log(keys);
                    _flag = false;

                    //main output
                    console.log(ret);
                    sleep.sleep(1);






                //console.log('%s \t %s \t %s \t %s',data.sno, data.university, data.location, data.link);

                },function(error){
                    console.error('error while getting deatails '+url,error);
                });



                
                
                
                
                // return false;
            	
            })

        }
    })

}

var getDeatilsFromPage = function(url,data){

    var defer = q.defer();

    request(url, function(error, response,html){

        if(!!error) { console.error('Could not load page',url, error); defer.reject(error)}

        var $ = cheerio.load(html);


        $('h2.text-uppercase').each(function(i,e){

            

            e = $(e);

            var title = e.text();

            if(title === 'Overview'){
                processOverview($,e,data);
            }
            else if(title === 'General Information'){
                processGeneralInformation($,e,data);

            }
            else if(title === 'Location'){
                // processLocation($,e,data);

            }
            else if(title === 'Size and Profile'){
                processSizeAndProfile($,e,data);

            } 
            else if(title === 'Yearly Tuition Range'){
                processTuitionRange($,e,data);
            }
            else if(title === 'Course Levels and Areas of Studies Areas of Studies'){
                processCourses($,e,data);

            }



        });

        defer.resolve(data);

    });

    return defer.promise;

}

function processOverview($,e,data){

}

function processGeneralInformation($,e,data){

    var panelBody = e.parent().parent().find('.panel-body');
    var tables = panelBody.find('table');

    tables.each(function(i,elem){
        elem = $(elem);
        //for each tr

        var acronym_exist_flag = 0;
        elem.find('tr').each(function(j,row){
            row = $(row);
            var key = row.find('th').first().text();
            if(key == 'Acronym') acronym_exist_flag = 1;
        })
        if(acronym_exist_flag == 0) data['acronym'] = 'na';


        elem.find('tr').each(function(j,row){
            row = $(row);

            var key = row.find('th').first().text();
            var value = row.find('td').first().text();
            if(key == 'Acronym' || key == 'Founded'){
                key = getKey(key);
                data[key] = value;
            }   
        })
    })

}

function processLocation($,e,data){

    var panelBody = e.parent().parent().find('.panel-body');
    var tables = panelBody.find('table');

    tables.each(function(i,elem){
        elem = $(elem);
        //for each tr
        elem.find('tr').each(function(j,row){
            row = $(row);

            var key = row.find('th').first().text();
            var value = row.find('td').first().text();
            if(key == 'Other locations'){
                key = getKey(key);
                data[key] = value;
            }
        })
    })

}


function processSizeAndProfile($,e,data){

    var panelBody = e.parent().parent().find('.panel-body');
    var tables = panelBody.find('table');

    tables.each(function(i,elem){
        elem = $(elem);
        //for each tr
        elem.find('tr').each(function(j,row){
            row = $(row);

            var key = row.find('th').first().text();
            var value = row.find('td').first().text();
            key = getKey(key);
            data[key] = value;
        })
    })
}

function processTuitionRange($,e,data){

    var panelBody = e.parent().parent().find('.panel-body');

    // console.log(panelBody.text());
   
   var table = panelBody.find('table');
   // console.log(table.text());

    table.each(function(i,elem){
        elem = $(elem);
        //for each tr

        elem.find('tr').each(function(j,row){
            if(j>0){
                row = $(row);
                row.find('td').each(function(k,td){
                    if(k == 1){
                        td = $(td)
                        if (j ==1){var key = 'UG Local'} else {var key = 'UG Intl.'}
                        var value = td.find('small').first().text();
                        key = getKey(key);
                        data[key] = value;
                    }
                    if(k == 2){
                        td = $(td)
                        if (j ==1){var key = 'PG Local'} else {var key = 'PG Intl.'}
                        var value = td.find('small').first().text();
                        key = getKey(key);
                        data[key] = value;
                    }

                })
            
                
            }
        })
        

    })



}


function processCourses($,e,data){


    var panelBody = e.parent().parent().find('.panel-body');
    // console.log(panelBody.text());
   
   var table = panelBody.find('table');
   // console.log(table.text());

    table.each(function(i,elem){
        elem = $(elem);
        //for each tr

        elem.find('tr').each(function(j,row){
            
            if(j > 2 && j<9){
                row = $(row);
                var field = '';
                switch (j) {
                        case 3:
                            var field = "Arts and Humanities";
                            break;
                        case 4:
                            var field = "Business and Social Sciences";
                            break;
                        case 5:
                            var field = "Language and Cultural";
                            break;
                        case 6:
                            var field = "Medicine and Health";
                            break;
                        case 7:
                            var field = "Engineering";
                            break;
                        case 8:
                            var field = "Science and Technology";
                        }


                row.find('td').each(function(k,td){
                    if(k != 0){
                        td = $(td)
                        var check_flag = td.find('img').attr('src')
                        
                        switch (k) {
                        case 1:
                            var key = field + " PreBachelor";
                            break;
                        case 2:
                            var key = field + " Bachelor";
                            break;
                        case 3:
                            var key = field + " Master";
                            break;
                        case 4:
                            var key = field + " Doctoral";
                        }
                        // console.log(getKey(key))
                        if(check_flag == '/i/1b.png.pagespeed.ce.uuwT9yD6ZA.png') {var value = 'Yes'} else {var value = 'No'}
                        key = getKey(key);
                        data[key] = value;
                    }
                })
                        
            }
        })
    
    })

}

function getKey (label){
    return label.toLowerCase().replace(/[\s]/g,'_');

}

var url = 'http://www.4icu.org/my/';


scrape(url);	



