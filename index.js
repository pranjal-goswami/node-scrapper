'use strict';

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var md5 = require('md5');

var q = require('q');

var baseUrl = 'http://www.4icu.org';

var scrape = function(url){

	var hash =  md5(url);
    
    request(url, function(error, response, html){
	
        if(!error){
            var $ = cheerio.load(html);

            console.log('%s, %s, %s, %s','sno','university','location','link');

            $('a.lead').each(function(i,e){


            	var data = {};
            	data.sno = i+1;
            	e = $(e);

            	data.link = baseUrl+e.attr('href');
            	data.university = e.text();

            	data.location = e.parent().siblings().last().text();

                getDeatilsFromPage(data.link,data).then(function(){



                    var ret = '';
                    for(var prop in data){
                        if(data.hasOwnProperty(prop)){
                            //data[prop] = (data[prop]+'').replace(/[,]/g,'\\,');
                            ret+= data[prop]+'\t';
                        }

                    }
                    console.log(ret);





                //console.log('%s \t %s \t %s \t %s',data.sno, data.university, data.location, data.link);

                },function(error){
                    console.error('error while getting deatails '+url,error);
                });




                return false;

            	

            	
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
            else if(title === 'Size and Profile'){
                processSizeAndProfile($,e,data);

            } else if(title === 'Yearly Tuition Range'){
                processTuitionRange($,e,data);
            }



        });

        defer.resolve(data);

    });

    return defer.promise;

}

function processOverview($,e,data){

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
    console.log(panelBody.text());
   
   var table = panelBody.find('table').first();
   console.log(table.text());



}

function getKey (label){
    return label.toLowerCase().replace(/[\s]/g,'_');

}

var url = 'http://www.4icu.org/ph/';


scrape(url);	



