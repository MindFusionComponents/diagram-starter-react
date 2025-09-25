import React, { useState, useRef } from 'react';
import './App.css';
import { Rect } from '@mindfusion/drawing';
import * as Diagramming from '@mindfusion/diagramming';
import {
  DiagramView, Overview, ZoomControl, Ruler,
  Palette, PaletteCategory, PaletteItem
} from '@mindfusion/diagramming-react';
import common from "@mindfusion/common-ui/themes/common-ui.css";
import business from "@mindfusion/common-ui/themes/business.css";

// styling
var shapeNodeStyle = new Diagramming.Style();
shapeNodeStyle.brush = { type: 'SolidBrush', color: '#e0e9e9' };
shapeNodeStyle.stroke = "#7F7F7F";
shapeNodeStyle.fontName = "Verdana";
shapeNodeStyle.fontSize = 4;
shapeNodeStyle.nodeEffects = [new Diagramming.GlassEffect()];

const initPalette = () => {
  // stock shape geometries are listed here:
  // https://www.mindfusion.eu/onlinehelp/jsdiagram/CC_refTable_of_Predefined_Shapes_4.htm

  // use the shape designer tool to draw custom shape geometries:
  // https://mindfusion.eu/tools/shape-designer.html

  // apart from ShapeNode, you could also add TableNode or ContainerNode objects
  var paletteItems = [];
  var shapes = ["Start", "Input", "Process", "Decision"]
  for (let i = 0; i < shapes.length; ++i) {
    let node = new Diagramming.ShapeNode();
    node.shape = shapes[i];
    node.style = shapeNodeStyle;
    paletteItems.push(new PaletteItem(node, shapes[i]));
  }

  var paletteItems1 = [];
  shapes = ["Database", "Input", "Delay", "Document", "ManualOperation"];
  for (let i = 0; i < shapes.length; ++i) {
    let node = new Diagramming.ShapeNode();
    node.shape = shapes[i];
    node.style = shapeNodeStyle;
    paletteItems1.push(new PaletteItem(node, shapes[i]));
  }

  var paletteItems2 = [];
  shapes = ["BpmnStartLink", "BpmnIntermediateLink", "BpmnEndLink",
    "BpmnStartMessage", "BpmnIntermediateMessage", "BpmnEndMessage"];
  for (let i = 0; i < shapes.length; ++i) {
    let node = new Diagramming.ShapeNode();
    node.shape = shapes[i];
    node.style = shapeNodeStyle;
    paletteItems2.push(new PaletteItem(node, shapes[i]));
  }

  return [paletteItems, paletteItems1, paletteItems2];
}

function App() {
  const [diagram] = useState(new Diagramming.Diagram());
  const [diagramView, setDiagramView] = useState(null);
  const diagramViewElement = useRef(null);

  diagram.style = shapeNodeStyle;
  // set the size of diagram's scrollable area (unit is millimeter by default)
  diagram.bounds = new Rect(0, 0, 1000, 1000);

  // you can create diagram items from code;
  // alternative syntax is diagram.addItem(new ShapeNode());
  var node1 = diagram.factory.createShapeNode(10, 10, 30, 30);
  node1.text = "Hello";

  var node2 = diagram.factory.createShapeNode(60, 25, 30, 30);
  node2.text = "World";

  diagram.factory.createDiagramLink(node1, node2);

  const onControlLoaded = () => {
    setDiagramView(diagramViewElement.current);
  }

  // detect user's actions by handling diagram events, such as nodeCreated
  const onNodeCreated = (diagram, args) => {
    console.log("user has created a node");
    args.node.brush = "lightblue";
  }

  // validation events let us prevent users' actions; for example,
  // onLinkCreating handler below prevents users from drawing a cycle
  const onLinkCreating = (diagram, args) => {
    if (args.destination == null) {
      // not pointing to a node yet
      return;
    }

    var pathFinder = new Diagramming.PathFinder(diagram);
    var path = pathFinder.findShortestPath(
      args.destination, args.origin);

    if (path != null) {
      // adding this new link would create a cycle
      // [origin]--[dest]--[path internal nodes]--[origin]

      args.cancel = true;
    }
  }

  function onNewClick() {
    diagram.clearAll();
  }

  const insecureContextMessage = 'The File System API is not available in this context. Please run the page from a web server (npm start).';

  async function onSaveClick() {
    try {
      // in this example we store diagram JSON files on local file system;
      // alternatively you could send JSON to server-side using fetch API, e.g.
      // fetch('api_url', { method: 'POST', ... }
      const json = diagram.toJson();

      // file system API is not fully supported in some browsers yet
      if (window.showSaveFilePicker) {
        if (!window.isSecureContext) {
          alert(insecureContextMessage);
          return;
        }

        const handle = await window.showSaveFilePicker(
          {
            startIn: 'documents',
            suggestedName: 'diagram.json',
            types: [{
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            }],
          });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
      }
      else {
        // work-around for browsers that do not support file system
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
    catch (err) {
      console.error(err.name, err.message);
    }
  }

  async function onLoadClick() {
    try {
      // in this example we store diagram JSON files on local file system;
      // alternatively you could load JSON from server-side using fetch API, e.g.
      // fetch('api_url', { method: 'GET', ... }

      // file system API is not fully supported in some browsers yet
      if (window.showOpenFilePicker) {
        if (!window.isSecureContext) {
          alert(insecureContextMessage);
          return;
        }

        const [handle] = await window.showOpenFilePicker(
          {
            startIn: 'documents',
            types: [{
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            }],
          });
        const file = await handle.getFile();
        const content = await file.text();
        diagram.fromJson(content);
      }
      else {
        // work-around for browsers that do not support file system
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          const content = await file.text();
          diagram.fromJson(content);
        };
        input.click();
      }
    }
    catch (err) {
      console.error(err.name, err.message);
    }
  }


  return (
    <div className="App">

      <div className="container">
        <div className="main">
          <div className="sidebar-left">
            <Overview diagramView={diagramView}></Overview>
            <Palette id="palette" padding={4} theme="business" height="calc(100% - 210px)">
              <PaletteCategory title="Flowchart Shapes" expanded={true} items={initPalette()[0]} ></PaletteCategory>
              <PaletteCategory title="Data Shapes" items={initPalette()[1]} ></PaletteCategory>
              <PaletteCategory title="BPMN Shapes" items={initPalette()[2]} ></PaletteCategory>
            </Palette>
          </div>
          <div className="main">
            <ZoomControl diagramView={diagramView} backColor={"transparent"} style={{ position: "absolute", right: 20, top: 30, zIndex: 2 }}></ZoomControl>
            <Ruler style={{ width: "100%" }}>
              <DiagramView
                diagram={diagram}
                id="diagram"
                linkBackId = "mindfusionLink"
                style={{ position: "absolute", width: 'auto', height: 'auto', left: 0, right: 0, top: 0, bottom: 0 }}
                onControlLoaded={() => onControlLoaded()}
                onLinkCreating={(sender, args) => onLinkCreating(sender, args)}
                onNodeCreated={(sender, args) => onNodeCreated(sender, args)}
                ref={diagramViewElement} />
            </Ruler>
          </div>
        </div>
        <div className="sidebar">
          <button onClick={onNewClick}>New</button>
          <button onClick={onSaveClick}>Save</button>
          <button onClick={onLoadClick}>Load</button>
        </div>
      </div>

      <div className="footer">
        <a id="mindfusionLink" href="https://mindfusion.dev/javascript-diagram.html">h/t MindFusion</a>
      </div>

    </div>
  );
}

export default App;
