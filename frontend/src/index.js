//import React from 'react';
//import ReactDOM from 'react-dom';
import PDFJS from '../node_modules/pdfjs-dist/build/pdf.combined.js';
import $ from 'jquery';
import _ from "lodash";
import Answersection from './Answersection';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";
import store from "./store.js";
// In production, the bundled pdf.js shall be used instead of RequireJS.
var scale = 1.5;
var pageheight = 0;
const pdfLink = window.__pdfLink__;//"exam10.pdf"
var cuts = _.mapValues(window.__cuts__, arr => 
        (arr.map(tup => 
                 [parseFloat(tup[0]),tup[1]])));
console.log("PRint cuts:",cuts);
var cutIds = _.mapValues(cuts,cutsOnPage => 
        _.reduce(cutsOnPage, (dic,tup) => 
            {var n = dic; n[tup[0]]=tup[1]; return n},{}));
console.log(cutIds);
var cuts = _.mapValues(cuts,cutsOnPage =>
        cutsOnPage.map(tup => tup[0]));
console.log(cuts);
//exclusive cut itself
function increaseAllAfter(pageNum,cut){
  var id = "canvas-"+pageNum+"-";
  var i = cut+1;
  var el = document.getElementById(id+i);
  while(el){
    i++;
    el = document.getElementById(id+i);
  }
  i--;
  for(;i>cut;i--){
    el = document.getElementById(id+i);
    el.id = id+(i+1);
  }
}



// create function, it expects 2 values.
function insertAfter(newElement,targetElement) {
    // target is what you want it to go after. Look for this elements parent.
    var parent = targetElement.parentNode;

    // if the parents lastchild is the targetElement...
    if (parent.lastChild === targetElement) {
        // add the newElement after the target element.
        parent.appendChild(newElement);
    } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

function copyCanvasToNewCanvasBelow(oldCanvas,start,end,newId,className){
  var newCanvas = document.createElement('canvas');
  var newContext = newCanvas.getContext('2d');
  var height = end-start;
  var width = oldCanvas.width;
  newCanvas.id = newId;
  newCanvas.className = className;
  newCanvas.style.display = "block";
  newCanvas.width = width;
  newCanvas.height = height;
  //apply the old canvas to the new one
  console.log("copy over (start,height,end):",start,height,end);
  newContext.drawImage(oldCanvas,0,start,width,height, 0, 0,width,height);
  insertAfter(newCanvas, oldCanvas);
}


function makeNewAnswerSectionAfter(element,pageNum,relHeight,makeNew){
  console.log("relHeight:",relHeight)
  var newSection = document.createElement('div');

  newSection.style.width = element.width+"px";
  newSection.className = "answersection";
  insertAfter(newSection,element);
  //newSection.removeClass("beforeanswersection");
  ReactDOM.render((<Provider store={store}>
    <Answersection _id={!makeNew ? cutIds[pageNum][relHeight] : null} pageNum={pageNum} relHeight={relHeight} makeNew={makeNew}/></Provider>),
    newSection
  );
  newSection.offsetWidth;
  $(newSection).addClass("answersectionheight");

}

//require(['pdfjs/display/api', 'pdfjs/display/global'], function (api, global) {
  // In production, change this to point to the built `pdf.worker.js` file.
  var searchingCutPoint = false;
  //global.PDFJS.workerSrc = '../../src/worker_loader.js';

  // Fetch the PDF document from the URL using promises.
  PDFJS.getDocument(pdfLink).then(function (pdf) {
    // Fetch the page.
    var currPage = 1;
    //enthält dictionaries {page:X,y:Y}, sorted by X and Y.
    var numPages = pdf.numPages;
    console.log("number of pages",numPages);
    function redraw(){
      $(".paper").remove();
      pdf.getPage(currPage).then( handlePages );
    }
    function redrawAdding(pageNum,y){
      console.log("y am Anfang von redrawAdding:",y);
      if(y<=1.);
      if(pageNum<=numPages);
      if(pageNum>0);
      var oldY = 0.;
      //var nextY = 0.;
      var i =0;
      if (parseInt(pageNum,10) in cuts){
        console.log("Number of cuts on page "+pageNum+": "+cuts[pageNum].length);
        for (i = 0;i<cuts[pageNum].length;i++){
          if(cuts[pageNum][i]>=y){
            break;
          }
          oldY = cuts[pageNum][i];
        }
        //if(i == cuts[pageNum].length){nextY = 1.0;}
        //else nextY = cuts[pageNum][i];
        //i is now the number of the offset base 1

        i++;
        var oldId = "canvas-"+pageNum+"-"+i;
        var nextId = "canvas-"+pageNum+"-"+(i+1);
        var oldCanvas = document.getElementById(oldId);
        if(oldCanvas != null){
          oldCanvas.id = "inwork";
          increaseAllAfter(pageNum,i);
          copyCanvasToNewCanvasBelow(oldCanvas,(y-oldY)*pageheight,oldCanvas.height,nextId,"paperwithoutmargintop");
          copyCanvasToNewCanvasBelow(oldCanvas,0,(y-oldY)*pageheight,oldId,"paper");
          oldCanvas.remove();
          console.log("Y1",y);
          makeNewAnswerSectionAfter(document.getElementById(oldId),pageNum,y,true);
          $("#"+nextId).addClass("paper");

        }else{
          console.log("oldId:",oldId);
        }
      }else{
        console.log("NO CUTS PRESENT ");
        var oldCanvas = document.getElementById("canvas-"+pageNum);
        if(oldCanvas != null){
          var newCanvas = document.createElement('canvas');
          var newContext = newCanvas.getContext('2d');
          newCanvas.id = "canvas-"+pageNum+"-1";
          newCanvas.className = "paper";
          newCanvas.style.display = "block";
          //set dimensions
          //pageheight = oldCanvas.height;
          var height = (y)*pageheight;
          //oldCanvas.height = y*pageheight;
          newCanvas.width = oldCanvas.width;
          newCanvas.height = height;
          //apply the old canvas to the new one
          newContext.drawImage(oldCanvas,0,0,oldCanvas.width,height, 0, 0,oldCanvas.width,height);
          insertAfter(newCanvas, document.getElementById("canvas-"+pageNum));

          var newCanvas = document.createElement('canvas');
          var newContext = newCanvas.getContext('2d');
          newCanvas.id = "canvas-"+pageNum+"-2";
          newCanvas.className = "paperwithoutmargintop";
          newCanvas.style.display = "block";
          //set dimensions
          //pageheight = oldCanvas.height;
          var height = (1-y)*pageheight;
          //oldCanvas.height = y*pageheight;
          newCanvas.width = oldCanvas.width;
          newCanvas.height = height;
          //apply the old canvas to the new one
          newContext.drawImage(oldCanvas,0,y*pageheight,oldCanvas.width,height, 0, 0,oldCanvas.width,height);
          insertAfter(newCanvas, document.getElementById("canvas-"+pageNum+"-1"));
          oldCanvas.remove();
          makeNewAnswerSectionAfter(document.getElementById("canvas-"+pageNum+"-1"),pageNum,y,true);
          $(newCanvas).addClass("paper");
          //document.body.appendChild(newCanvas);
        }else{
          console.log("pagenum does not exist:",pageNum);
        }

      }




      if (pageNum in cuts){
        cuts[pageNum].push(y);
      }else{
        cuts[pageNum] = [y];
      }
      cuts[pageNum].sort();
    }
    function handlePages(page)
    {
      //This gives us the page's dimensions at full scale
      var pageWidth = page.getViewport(1.0).width;
      var displayWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var scale = Math.min((displayWidth/pageWidth)*0.9,1.5)
      var viewport = page.getViewport( scale );
      var id = "canvas-"+currPage;
      var pageNum = currPage;
      console.log("currPage:"+currPage);
      //We'll create a canvas for each page to draw it on
      var canvas = document.createElement( "canvas" );
      canvas.id = id;
      canvas.className="paper";
      canvas.style.display = "block";
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      pageheight = canvas.height;

      if(""+currPage in cuts){
        //var pagehere = currPage;
        var oldCanvas = canvas;
        var prevCut = 0;
        var localCuts = cuts[""+currPage].slice();
        var prevCanvas = null;
        localCuts = localCuts.sort();
        localCuts.push(1.);

        var prevCut = 0;
        for(var i = 0; i<localCuts.length;i++){
          var thisCut = localCuts[i];
          var newCanvas = document.createElement('canvas');
          newCanvas.className = "paper";

          newCanvas.style.display = "block";
          newCanvas.id = id+"-"+(i+1);
          document.body.appendChild(newCanvas);
          var height = thisCut*pageheight-prevCut*pageheight;
          newCanvas.width = oldCanvas.width;
          newCanvas.height = height;
          prevCut = thisCut;
        }
        page.render({canvasContext: context, viewport: viewport}).then(function(){
          var subpartcount = 1;
          prevCut = 0;
          while(localCuts!== null && localCuts.length !== 0){

            var thisCut = localCuts[0];
            //var newCanvas = document.createElement('canvas');
            var newCanvas = document.getElementById(id+"-"+subpartcount);
            var newContext = newCanvas.getContext('2d');

            //set dimensions
            var height = (thisCut-prevCut)*pageheight;
            if (prevCanvas != null && prevCut != 1.){
              makeNewAnswerSectionAfter(prevCanvas,pageNum,prevCut,false);
            }
            //apply the old canvas to the new one
            newContext.drawImage(oldCanvas,0,prevCut*pageheight,oldCanvas.width,height, 0, 0,oldCanvas.width,height);

            //document.body.appendChild(newCanvas);
            subpartcount++;
            localCuts = localCuts.slice(1);
            prevCut = thisCut;
            prevCanvas = newCanvas;
          }

        });
      }else{
        console.log("NONE");
        page.render({canvasContext: context, viewport: viewport});
        document.body.appendChild(canvas);
      }


      //Draw it on the canvas

      //document.body.appendChild( canvas );

      //Add it to the web page



      //Move to next page
      currPage++;
      if ( pdf !== null && currPage <= numPages )
      {
          pdf.getPage(currPage).then( handlePages );
      }else{
        currPage = 1;
        if(!$("#add").length){
          $("body").append("<div id='add'>+</div>");
          $("#add").click(function (){
            if(!searchingCutPoint){
              $(".paper").css("cursor","crosshair");
              $(".paper").click(function(e){
                  console.log("CLICK:"+e.target.id);
                  var parentOffset = $(this).offset();
                  //or $(this).offset(); if you really just want the current element's offset
                  //var relX = e.pageX - parentOffset.left;
                  var relY = e.pageY - parentOffset.top;
                  var id = e.target.id;
                  var idlist = id.split("-");
                  var pageNum = idlist[1];
                  var offset = 0.;
                  if(idlist.length>2){
                    var subNum = parseInt(idlist[2],10);
                    if (subNum>1){
                      offset = cuts[pageNum][subNum-2];
                    }
                  }
                  var y = 0.;

                  if (pageNum in cuts){
                    console.log("gib:"+pageheight);
                    y = relY/pageheight+offset;
                    //cuts[pageNum].push(relY/pageheight+offset);
                  }else{
                    console.log("gib:"+pageheight);
                    y = relY/pageheight;
                    //cuts[pageNum] = [relY/pageheight];
                  }
                  //cuts[pageNum].sort();
                  //console.log("CUTS");
                  //console.log(cuts);
                  $(".paper").off('click');
                  $(".paper").css("cursor","default");
                  searchingCutPoint = !searchingCutPoint;
                  $("#add").html("+");
                  //redraw();
                  redrawAdding(pageNum,y);
              });
              $(this).html("x");
              searchingCutPoint = !searchingCutPoint;
            }else{
              $(".paper").css("cursor","default");
              $(".paper").off('click');

              $(this).html("+");
              searchingCutPoint = !searchingCutPoint;
            }
          });
        }

      }
    }
    redraw(cuts);

  },function(error){
    console.log("ERROR:",error);
  });

//});
