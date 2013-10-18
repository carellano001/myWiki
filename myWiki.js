(function () {
"use strict";
// = Utilities =
var StringUtilities={};
StringUtilities.capitalize=function(str){
 return str.charAt(0).toUpperCase() + str.slice(1);
};
StringUtilities.uncapitalize=function(str){
 return str.charAt(0).toLowerCase() + str.slice(1);
};
StringUtilities.wrapParam=function(param){
 return JSON.stringify(param);
};

// = Wrapper =
var WikipediaWrapper=function(){
 this.nodes={};
 this.nodes.articleName={node:null,listeners:{},locator:function(){return window.location.href.replace(/_/g," ");},supplements:[],value:null,regexp:/^http:\/\/en\.wikipedia\.org\/wiki\/([^?#]+)/};
 this.nodes.sections={nodes:[],listeners:[],xpath:"//*[@id='mw-content-text']/h2",supplements:[],values:[],
                      regexp:function(node){
						  return node.getElementsByClassName('mw-headline')[0].textContent;
                      },
                      template: function(){
						  var object={};
						  object.executeTemplate=function(parameter){
							  var request=new XMLHttpRequest();  
							  request.open("GET","http://en.wikipedia.org/w/api.php?format=xml&action=parse&text="+encodeURIComponent(parameter),false);  
							  request.send(null);
							  var res;
							  if (request.status === 200) {
							   var parser=new DOMParser();
							   var xml=parser.parseFromString(request.responseText,"application/xml");
							   var content=xml.evaluate("/api/parse/text/text()", xml, null, XPathResult.ANY_TYPE, null).iterateNext();
							   content=content.textContent;	  
							   res=document.createElement("div");
							   res.className="weavedWikinote";
							   res.innerHTML=content;
							  } 
							  return res;
						  };
						  return object;
					  }
                      };
 this.nodes.toc={nodes:[],listeners:[],xpath:"//*[@class='toc']/ul/li",supplements:[]}; 				  					   
 this.nodes.namespaceTabs={nodes:[],listeners:{},xpath:"//*[@id='p-namespaces']/ul/li",supplements:[],
                      template: function(){
						  var object={};
						  object.executeTemplate=function(parameter){
							  var tabTemplate=document.createElement("template");
							  tabTemplate.innerHTML="<li id=''><span><a href='#'></a></span></li>";
							  var newTab=tabTemplate.content.cloneNode(true);							  
							  newTab.querySelector("li").setAttribute("id","ca-"+parameter);
							  newTab.querySelector("a").innerHTML= parameter;
							  return newTab.querySelector("li");
						  };
						  return object;						  
					  }
                      }; 
 this.nodes.articleTab={node:null,listeners:{},xpath:"//*[@id='ca-nstab-main']",supplements:[]}; 				  
 this.nodes.readTab={node:null,listeners:{},xpath:"//*[@id='ca-view']",supplements:[]}; 
 this.nodes.editTab={node:null,listeners:{},xpath:"//*[@id='ca-edit']",supplements:[]};  
 this.nodes.content={node:null,listeners:{},xpath:"//*[@id='content']",supplements:[]};  
 this.nodes.bodyContent={node:null,listeners:{},xpath:"//*[@id='bodyContent']",supplements:[]};  
};
WikipediaWrapper.prototype.isApplicableToThisPage=function(){
 return window.location.href.match(/https?:\/\/[a-z]{2,3}\.wikipedia\.org/)!=null;
};
WikipediaWrapper.prototype.init=function(){
 var obj=this;
 /*window.addEventListener("load",function(ev){*/obj._populateObj();/*},true)*/;
};
WikipediaWrapper.prototype._populateObj=function(){
 var type;
 for(type in this.nodes){
  var node=this.nodes[type];
  var nod=null;
  if(node.xpath!=null){
   var tempNod=document.evaluate(node.xpath,document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
   if(node.nodes!=null){
    nod=[];
	var i=0;
	for(i=0;i<tempNod.snapshotLength;i++){
     nod[i]=tempNod.snapshotItem(i);
 	 if(node.regexp!=null){	 
	  var val;
	  if(typeof node.regexp=="function"){
	   val=node.regexp(nod[i]);
	  }else{
	   val=this._getFirstMatch(nod[i].textContent,node.regexp);
	  }
      node.values[node.values.length]=val;
	 }	   
	}
	node.nodes=nod;
   }else if(tempNod.snapshotLength>0){
	nod=tempNod.snapshotItem(0);  
	if(node.regexp!=null){
	 node.value=this._getFirstMatch(nod.textContent,node.regexp);  
	}	    	
	node.node=nod;
   }
  }else if(node.locator){
   nod=node.locator();
   if(node.regexp!=null){
    node.value=this._getFirstMatch(nod,node.regexp);
   }
   node.node=nod;  	
  }
 }
};
WikipediaWrapper.prototype._getFirstMatch=function(content,regexp){
 var res=null;
 var matches=content.match(regexp);
 if(matches!=null){
  res=matches[1];
 }   
 return res;
};
WikipediaWrapper.prototype._getNode=function(type){
 return this.nodes[type];
};
WikipediaWrapper.prototype.getArticleName=function(){
 return this.nodes.articleName.value;
};
WikipediaWrapper.prototype.getSections=function(){
 return this.nodes.sections.values;
};
WikipediaWrapper.prototype.injectIntoSections=function(node,position){
 this._addSibling(this.nodes.sections,node,position);
 var h2=node.getElementsByTagName("h2")[0];
 if(h2!=null){
  var name=h2.firstElementChild.textContent;
  var tocEntry=document.createElement("li");
  tocEntry.className="toclevel-1 weavedToc";
  tocEntry.innerHTML="<a href='#"+name.replace(/ /g,"_")+"'><span class='tocnumber'>X</span> <span class='toctext'>"+name+"</span></a></li>";
  this._addSibling(this.nodes.toc,tocEntry,position); 	
 }
};
WikipediaWrapper.prototype.getSectionTemplate=function(){
 return this.nodes.sections.template();  
};
WikipediaWrapper.prototype.injectIntoNamespaceTabs=function(node,position){
 this._addSibling(this.nodes.namespaceTabs,node,position);
};
WikipediaWrapper.prototype.getNamespaceTabTemplate=function(){
 return this.nodes.namespaceTabs.template();
};
WikipediaWrapper.prototype.setArticleTabSelection=function(flag){
 if(flag){
  this.nodes.articleTab.node.className="selected";
 }else{
  this.nodes.articleTab.node.removeAttribute("class");
 }
};
WikipediaWrapper.prototype.setReadTabSelection=function(flag){
 if(flag){
  this.nodes.readTab.node.className="selected";
 }else{
  this.nodes.readTab.node.removeAttribute("class");
 }
};
WikipediaWrapper.prototype.listenToReadTab=function(ev,f){
 this._addListener(this.nodes.readTab,ev,f);
};
WikipediaWrapper.prototype.setEditTabSelection=function(flag){
 if(flag){
  this.nodes.editTab.node.className="selected";
 }else{
  this.nodes.editTab.node.removeAttribute("class");
 }
};
WikipediaWrapper.prototype.listenToEditTab=function(ev,f){
 this._addListener(this.nodes.editTab,ev,f);
};
WikipediaWrapper.prototype.injectIntoContent=function(node,position){
 this._addChild(this.nodes.content,node);
};
WikipediaWrapper.prototype.getContentInjections=function(){
 return this.nodes.content.supplements;  
};
WikipediaWrapper.prototype.removeContentInjection=function(node){
 this._removeChild(this.nodes.content,node);
};
WikipediaWrapper.prototype.setBodyContentDisplay=function(display){
 this.nodes.bodyContent.node.style.display=display;
};
WikipediaWrapper.prototype.applyTemplate=function(template,params){
 return template.executeTemplate(params);
};
WikipediaWrapper.prototype._addChild=function(node,toAdd){
 var n=node.node;
 if(n!=null&&toAdd!=null){
  n.appendChild(toAdd);
  node.supplements[node.supplements.length]=toAdd;
 }
};
WikipediaWrapper.prototype._addSibling=function(node,toAdd,position){
 var n=node.nodes;
 if(position==null){position=n.length;} 
 if(n!=null&&toAdd!=null&&position<=n.length){
  if(position==n.length){
   var last=n[position-1];
   last.parentNode.appendChild(toAdd);  	
  }else{
   var refNode=n[position];
   refNode.parentNode.insertBefore(toAdd,refNode);	
  }
  node.supplements[node.supplements.length]=toAdd;
 }
};
WikipediaWrapper.prototype._removeChild=function(node,toRemove){
 var ind=node.supplements.indexOf(toRemove);
 var n=node.node; 
 if(n!=null&&ind>-1){
  node.supplements.splice(ind,1);
  n.removeChild(toRemove);     
 }
};
WikipediaWrapper.prototype._addListener=function(node,ev,f){
 var handlers=node.listeners[ev];
 var realNode=node.node; 
 if(realNode!=null){
  if(handlers==null){
   handlers={};
   node.listeners[ev]=handlers;
   var obj=this;
   handlers.userHandlers=[];
   var obj=this;  
   handlers.mainManager=function(eve){obj._notifyToAll(eve,handlers);}
   realNode.addEventListener(ev,handlers.mainManager,true);
  }
  handlers.userHandlers[handlers.userHandlers.length]=f;
 }
};

var Wikipedia=new WikipediaWrapper();
Wikipedia.init();

WikipediaWrapper.prototype._notifyToAll=function(ev,ls){
 var i=0;
 for(i=0;i<ls.userHandlers.length;i++){
  var listen=ls.userHandlers[i];
  listen(ev);
 }
};

// = View =
var TabView=function(){
 this.name=null;
 this.click=null; 
};
TabView.prototype.setViewData=function(params){
 this.name=params.name;
 this.click=params.click;
};
TabView.prototype.render=function(){
 var obj=this;
 var tabTemplate=Wikipedia.getNamespaceTabTemplate();	 
 var tab=Wikipedia.applyTemplate(tabTemplate,this.name);	
 tab.getElementsByTagName("a")[0].addEventListener("click",function(ev){
  ev.preventDefault();
  if(tab.className!="selected"){
   tab.className="selected";
   Wikipedia.setArticleTabSelection(false);
   obj.click(ev);
  }
 },true);
 return tab;
};

var SectionView=function(){
 this.note=null;
};
SectionView.prototype.setViewData=function(params){
 this.note=params.note;
};
SectionView.prototype.render=function(){
 return Wikipedia.applyTemplate(Wikipedia.getSectionTemplate(),this.note); 
};

var WikinoteReadView=function(){
 this.notes=null;
 this.editController=null;
};
WikinoteReadView.prototype.setViewData=function(params){
 this.notes=params.notes;
 this.editController=params.editController;
}; 
WikinoteReadView.prototype.render=function(){
 var panel=document.createElement("div");
 var i=0;
 for(i=0;i<this.notes.length;i++){
  var note=this.notes[i];
  var h2=document.createElement("h2");
  h2.className="renderedWikinote";
  var edit=document.createElement("span");
  edit.className="editsection";
  var a=document.createElement("a");
  a.appendChild(document.createTextNode("edit"));
  var controller=this.controller;
  a.addEventListener("click",function(ev){ev.preventDefault();new this.editController().execute("edit",note);},true);
  var openBracket=document.createElement("span");
  openBracket.className="mw-editsection-bracket";
  openBracket.appendChild(document.createTextNode("["));
  edit.appendChild(openBracket);
  edit.appendChild(a);
  var closeBracket=document.createElement("span");
  closeBracket.className="mw-editsection-bracket";
  closeBracket.appendChild(document.createTextNode("]"));
  edit.appendChild(closeBracket);
  var title=document.createElement("span");
  title.className="mw-headline";
  var titleContent="OnArticle("+StringUtilities.wrapParam(note.getOnArticle())+").";
  titleContent=titleContent+StringUtilities.capitalize(note.getRelativePosition())+"Section("+StringUtilities.wrapParam(note.getSectionName())+")";
  title.appendChild(document.createTextNode(titleContent));
  h2.appendChild(title);	
  h2.appendChild(edit);      		
  var p=document.createElement("p");
  p.appendChild(this.generateLayerRenderingTable(note));	
  panel.appendChild(h2);
  panel.appendChild(p);
 }
 return panel;
}; 
WikinoteReadView.prototype.generateLayerRenderingTable=function(note){
 var table=document.createElement("table");
 table.className="infobox";
 table.style.cssFloat="none";
 table.style.width="22em";	
 var caption=document.createElement("caption");
 var i=document.createElement("i");
 i.appendChild(document.createTextNode("Note"));
 caption.appendChild(i);
 table.appendChild(caption);	
 var tbody=document.createElement("tbody");
 table.appendChild(tbody);	
 this.generateLayerRenderingTableRow(table,"onArticle",note.getOnArticle());
 this.generateLayerRenderingTableRow(table,note.getRelativePosition()+"Section",note.getSectionName());
 this.generateLayerRenderingTableRow(table,"embedNote",note.getEmbedNote());
 return table;
};
WikinoteReadView.prototype.generateLayerRenderingTableRow=function(table,first,second){
 var tr=document.createElement("tr");
 var th=document.createElement("th");
 th.style.textAlign="left";
 var td=document.createElement("td");
 tr.appendChild(th);
 tr.appendChild(td);
 th.appendChild(document.createTextNode(first));
 td.appendChild(document.createTextNode(second));
 table.appendChild(tr);
 return tr;
};

var WikinoteEditView=function(){
 this.notes=null;	
 this.cancelController=null;
 this.saveController=null;
 this.textarea=null;
};
WikinoteEditView.prototype.setViewData=function(params){
 this.notes=params.notes;
 this.cancelController=params.cancelController;
 this.saveController=params.saveController;
};
WikinoteEditView.prototype.render=function(){
 var div=document.createElement("div");
 div.id="mw-content-text";
 var divIn=document.createElement("div");
 divIn.id="wikiPreview";
 divIn.className="ontop";
 div.appendChild(divIn);			
 var form=document.createElement("form");
 form.id="editForm";
 div.appendChild(form);		
 this.textarea=document.createElement("textarea");
 this.textarea.id="wpTextbox1";
 this.textarea.rows="25";
 this.textarea.cols="80";
 form.appendChild(this.textarea);
 var editButtons=document.createElement("div");
 editButtons.className="editButtons";
 var input=document.createElement("input");
 input.type="submit";
 input.value="Save Wikinote";	
 input.id="wpSave";
 var span=document.createElement("span");
 span.className="cancelLink";
 var a=document.createElement("a");
 a.id="mw-editform-cancel";
 a.appendChild(document.createTextNode("Cancel"));
 var saveController=this.saveController;
 var cancelController=this.cancelController;
 input.addEventListener("click",function(ev){ev.preventDefault();saveController.execute("save");},true);
 a.addEventListener("click",function(ev){ev.preventDefault();cancelController.execute("cancel");},true);				
 editButtons.appendChild(input);
 span.appendChild(a);
 editButtons.appendChild(span);
 form.appendChild(editButtons);					
 var i=0;
 for(i=0;i<this.notes.length;i++){
  var note=this.notes[i];
   var sep="";
   if(this.textarea.value!=""){
    sep="\n\n";
   }
   this.textarea.value=this.textarea.value+sep+""+note.export();	
 }		  
 var editorAJAX=document.createElement("script");
 editorAJAX.type="text/javascript";
 var head=document.getElementsByTagName("head")[0];
 var script=null;
 var wikinoteEmbed1=this.generateWikinoteTemplate();
 var wikinoteEmbed2="//TODO - Extract from other Web pages\n\n";		
 var templateB=this.generateAddToToolbarSection("wpTextbox1","wikilayer","Wikinote")+
               this.generateAddToToolbarGroup("wpTextbox1","wikilayer","embed","Embedded Note")+
               this.generateAddToToolbarTool("wpTextbox1","wikilayer","embed","wikinote11","Embed WikiText","http://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Pen_1.svg/22px-Pen_1.svg.png",wikinoteEmbed1)+				
               this.generateAddToToolbarTool("wpTextbox1","wikilayer","embed","wikinote12","Embed extractFromPage","http://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Applications-internet_Gion.svg/22px-Applications-internet_Gion.svg.png",wikinoteEmbed2);							
 if(document.body.getAttribute("MYAJAX")!="true"){	
  script="mw.loader.using(\"ext.wikiEditor.toolbar\", function(){\n"+
  templateB+
  "});\n"+	
  "document.body.setAttribute('MYAJAX','true');";					
 }else{
  script="$.wikiEditor.instances.pop();\n"+
  "$('#wpTextbox1').wikiEditor( 'addModule', $.wikiEditor.modules.toolbar.config.getDefaultConfig() );\n"+
  templateB;
  var scripts=head.getElementsByTagName("script");	
  head.removeChild(scripts[scripts.length-1]);
 }
 editorAJAX.appendChild(document.createTextNode(script));	
 head.appendChild(editorAJAX);  
 return div;	
}; 
WikinoteEditView.prototype.generateAddToToolbarSection=function(txtBoxId,sectionName,sectionLabel){
 return "$('#"+txtBoxId+"').wikiEditor( 'addToToolbar', {'sections': { '"+sectionName+"': { 'type': 'toolbar',  'label': '"+sectionLabel+"' } } } );\n";
};
WikinoteEditView.prototype.generateAddToToolbarGroup=function(txtBoxId,sectionName,groupName,groupLabel){
 return "$('#"+txtBoxId+"').wikiEditor( 'addToToolbar', {'section': '"+sectionName+"', 'groups': { '"+groupName+"': { 'label': '"+groupLabel+"' }  } } );\n";				
};
WikinoteEditView.prototype.generateAddToToolbarTool=function(txtBoxId,sectionName,groupName,toolName,toolLabel,icon,templateContent){
 return "$('#"+txtBoxId+"').wikiEditor( 'addToToolbar', {'section': '"+sectionName+"','group': '"+groupName+"', 'tools': {'"+toolName+"': { label: '"+toolLabel+"', type: 'button', icon: '"+icon+"',action: { type: 'replace', options: { pre: '"+templateContent.replace(/\n/g,"\\n").replace(/'/g,"\\'")+"'  } } } } } );\n";		
};
WikinoteEditView.prototype.generateWikinoteTemplate=function(){
 var str="{{Wikinote\n";
 str=str+" | onArticle=\"ArticleName\" //Article name as it appears on the URL\n";
 str=str+" | afterSection=\"1\" //Ordinal or Name of one this article's sections\n";
 str=str+" | embedNote=\"== New Section == \\\nTest text.\"\n";				
 str=str+"}}\n\n";
 return str;
}; 

// = Model =
var Wikinote=function(props){
 this.props=props!=null?props:{_onArticle:null,_sectionName:null,_relativePosition:null,_embedNote:null};
};
Wikinote._load=function(callback){
 if(Wikinote._allNotes==null){
  Wikinote._status="Loading";	 
  chrome.storage.local.get("notes",function(res){
  Wikinote._status="Loaded";	 	  
  Wikinote._allNotes=res["notes"];
  if(Wikinote._allNotes==null){
   Wikinote._allNotes=[];
   Wikinote.update();
  }
  callback();
  });
 }
};
Wikinote._status="noLoaded";
Wikinote._callBacks=[];
Wikinote._allNotes=null;
Wikinote.prototype.getOnArticle=function(){
 return this.props._onArticle;
};
Wikinote.prototype.setOnArticle=function(article){
 this.props._onArticle=article;
 this.update();
};
Wikinote.prototype.getSectionName=function(){
 return this.props._sectionName;
};
Wikinote.prototype.setSectionName=function(section){
 this.props._sectionName=section;
 this.update();
};
Wikinote.prototype.getRelativePosition=function(){
 return this.props._relativePosition;
};
Wikinote.prototype.setRelativePosition=function(position){
 this.props._relativePosition=position;
 this.update();
};
Wikinote.prototype.getEmbedNote=function(){
 return this.props._embedNote;
};
Wikinote.prototype.setEmbedNote=function(note){
 this.props._embedNote=note;
 this.update();
};
Wikinote._create=function(props){
 var wikinote=new Wikinote(props); 
 Wikinote._allNotes[Wikinote._allNotes.length]=wikinote.props;
 wikinote.update();
 return wikinote;
};
Wikinote.find=function(article,callback){
 var op=function(){
  var notes=[];
  var currentArticle=Wikipedia.getArticleName();
  var i=0;
  for(i=0;i<Wikinote._allNotes.length;i++){
   var note=Wikinote._allNotes[i];
   if(note._onArticle==currentArticle){
    notes[notes.length]=new Wikinote(note);
   }	 
  }
  return notes;
 }
 if(Wikinote._status=="noLoaded"){
  Wikinote._callBacks[Wikinote._callBacks.length]=callback;	 
  Wikinote._load(function(){
   var res=op();
   var i=0;
   for(i=0;i<Wikinote._callBacks.length;i++){
	Wikinote._callBacks[i](res);
   }
   Wikinote._callBacks=[];
  });
 }else if(Wikinote._status=="Loading"){
  Wikinote._callBacks[Wikinote._callBacks.length]=callback;
 }else if(Wikinote._status=="Loaded"){
  return callback(op());	
 }
};
Wikinote.prototype.update=function(){
 Wikinote.update();
};
Wikinote.update=function(){
 chrome.storage.local.set({"notes":Wikinote._allNotes});
};
Wikinote.prototype.delete=function(){
 var i=Wikinote._allNotes.indexOf(this.props);
 if(i>=0){
  Wikinote._allNotes.splice(i,1);
  this.update();  
 }
};
Wikinote.parseNotes=function(txt){	
 var matches=txt.match(/\{\{Wikinote(([^}]|[}][^}])*)\}\}/g);
 var parsedNotes=[];
 var i=0;
 for(i=0;matches&&i<matches.length;i++){
  var unparsedNote={};	
  var noteMatchWhole=matches[i];
  var noteMatch=noteMatchWhole.match(/\{\{Wikinote(([^}]|[}][^}])*)\}\}/);
  var noteClausesMatch=noteMatch[1].match(/\|\ +[^=]+=\"([^"]*)\"/g);
  var j=0;		
  for(j=0;j<noteClausesMatch.length;j++){
   var noteClauseWhole=noteClausesMatch[j];
   var noteClauseMatch=noteClauseWhole.match(/\|\ +([^=]+)=(\"[^"]*\")/);
   unparsedNote[noteClauseMatch[1]]=noteClauseMatch[2];
  }
  var parsed=Wikinote.parseNote(unparsedNote);
  var note=null;
  if(parsed){
   note=parsed;
  }else{
   note=noteMatchWhole;		
  }
  parsedNotes[parsedNotes.length]=note;		
 }
 return parsedNotes;
};
Wikinote.parseNote=function(unparsed){
 var note={};
 var clauses=0;
 var type;
 var found=false; 
 var value=unparsed["onArticle"];
 if(value!=null){
  note._onArticle=JSON.parse(value);
  clauses++;
 }

 var value1=unparsed["beforeSection"];
 var value2=unparsed["afterSection"];
 var value3=unparsed["uponSection"];
 var value=null;	
 if(value1){
  value=value1;
  note._relativePosition="before";
 }else if(value2){
  value=value2;
  note._relativePosition="after";
 }else if(value3){
  value=value3;
  note._relativePosition="upon";
 }		
 
 if(value){
  note._sectionName=JSON.parse(value);
  clauses++;
 }			
 var value=unparsed["embedNote"];
 var extractNote=JSON.parse(value).match(/^extract([^(]+)\('([^']+)'(?:,'([^']+)')?\)$/);
 if(extractNote==null){
  note._embedNote=JSON.parse(value);
  clauses++;
 }			
 return clauses==3?note:null;
};
Wikinote.prototype.export=function(){
 var str="{{Wikinote\n";
 str=str+"| onArticle=\""+this.props._onArticle+"\"\n";
 str=str+"| "+this.props._relativePosition+"Section="+StringUtilities.wrapParam(this.props._sectionName)+"\n"; 
 str=str+"| embedNote="+StringUtilities.wrapParam(this.props._embedNote)+""; 
 str=str+"\n}}";
 return str;
}; 

// = Controller =
var ArticleIController=function(){
 if (ArticleIController.prototype._singletonInstance) {
  return ArticleIController.prototype._singletonInstance;
 }
 ArticleIController.prototype._singletonInstance = this;	
};
ArticleIController.prototype.execute=function(){
 var currentArticle=Wikipedia.getArticleName(); 	
 Wikinote.find(currentArticle,function(notes){		
 var sections=Wikipedia.getSections();
 var i=0;
 for(i=0;i<notes.length;i++){
  var note=notes[i];
  var view=new SectionView();
  view.setViewData({note:note.getEmbedNote()});
  var index=sections.indexOf(note.getSectionName());
  if(note.getRelativePosition()=="after"){
   index++;
  }
  Wikipedia.injectIntoSections(view.render(),index);
 }  	
 });
}; 

var ManagerIController=function(){
 if (ManagerIController.prototype._singletonInstance) {
  return ManagerIController.prototype._singletonInstance;
 }
 ManagerIController.prototype._singletonInstance = this;	
};
ManagerIController.prototype.execute=function(){
 Wikipedia.setBodyContentDisplay("none");
 var read=new ReadEController();
 new EditEController().init();
 read.init()
 read.execute();	
}; 

var LoadEController=function(){
 if (LoadEController.prototype._singletonInstance) {
  return LoadEController.prototype._singletonInstance;
 }
 LoadEController.prototype._singletonInstance = this;	
};
LoadEController.prototype.init=function(func){
 var obj=this;
 /*window.addEventListener("load",function(){*/obj.execute();/*},true)*/;  
};

LoadEController.prototype.execute=function(){	
 var obj=this; 
 var currentArticle=Wikipedia.getArticleName(); 
 if(currentArticle!=null){
  var tabParams={
   name:"myWiki",
   click:function(ev){
    new ManagerIController().execute();
   }
  }
  var tab=new TabView();
  tab.setViewData(tabParams);
  Wikipedia.injectIntoNamespaceTabs(tab.render());
  new ArticleIController().execute();
 }
}; 

new LoadEController().init();

var ReadEController=function(){
 if (ReadEController.prototype._singletonInstance) {
  return ReadEController.prototype._singletonInstance;
 }
 ReadEController.prototype._singletonInstance = this;		
 this.executed=false;	
};
ReadEController.prototype.init=function(){
 var obj=this; 
 Wikipedia.listenToReadTab("click",function(ev){
  ev.preventDefault();
  ev.stopPropagation();
  if(!obj.executed){
   obj.execute();  
  }
 });
};
ReadEController.prototype.execute=function(){
 this.executed=true;	
 new EditEController().executed=false; 	
 Wikipedia.setReadTabSelection(true);
 Wikipedia.setEditTabSelection(false);
 var prevI=Wikipedia.getContentInjections();
 var i=0;
 for(i=0;i<prevI.length;i++){
  Wikipedia.removeContentInjection(prevI[i]);
 }
 var wikinoteReadView=new WikinoteReadView();
 Wikinote.find(Wikipedia.getArticleName(),function(notes){
 wikinoteReadView.setViewData({notes:notes});
 var notesRendering=wikinoteReadView.render();
 Wikipedia.injectIntoContent(notesRendering); 		
 });
};

var EditEController=function(){
 if (EditEController.prototype._singletonInstance) {
  return EditEController.prototype._singletonInstance;
 }
 EditEController.prototype._singletonInstance = this;		
 this.executed=false;
 this.editingNotes=null;
 this.wikinoteEditView=null;	
};
EditEController.prototype.init=function(){
 var obj=this;
 Wikipedia.listenToEditTab("click",function(ev){
  ev.preventDefault();
  ev.stopPropagation();
  if(!obj.executed){
   obj.execute();  
  }
 });	
};
EditEController.prototype.execute=function(op,note){
 if(op==null||op=="edit"){
  this.edit(op,note);
 }else if(op=="save"){
  this.save();
 }else if(op=="cancel"){
  this.cancel();
 }
};
EditEController.prototype.edit=function(op,note){
 this.executed=true;
 new ReadEController().executed=false; 	
 Wikipedia.setReadTabSelection(false);
 Wikipedia.setEditTabSelection(true); 
 var prevI=Wikipedia.getContentInjections();
 var i=0;
 for(i=0;i<prevI.length;i++){
  Wikipedia.removeContentInjection(prevI[i]);
 }
 this.wikinoteEditView=new WikinoteEditView();
 
 var obj=this;
 var renderNotes=function(notes){
 obj.wikinoteEditView.setViewData({notes:notes,cancelController:obj,saveController:obj});
 var notesRendering=obj.wikinoteEditView.render();
 Wikipedia.injectIntoContent(notesRendering);
 obj.editingNotes=notes;
 }
 
 if(note!=null){
  renderNotes([note]);	
 }else{
  Wikinote.find(Wikipedia.getArticleName(),renderNotes); 	
 }
};
EditEController.prototype.save=function(){
 var i=0;
 for(i=0;i<this.editingNotes.length;i++){
	 this.editingNotes[i].delete();
 }
 var notes=Wikinote.parseNotes(this.wikinoteEditView.textarea.value);
 for(i=0;i<notes.length;i++){
	 Wikinote._create(notes[i]);
 }
 new ReadEController().execute(); 	
};

EditEController.prototype.cancel=function(){
 new ReadEController().execute(); 	
};
}());