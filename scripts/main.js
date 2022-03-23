
import ForceGraph from 'force-graph';
import * as utilities from '../util/utilities.js';

const GRAPH_HTML_CONTAINER_ID = 'graphContainer';
const NETWORK_GRAPH_DATA_JSON_PATH = 'data/networkGraphData.json';
const NODE_IMAGE_DIRECTORY_PATH = './images/nodes/';

// Creating Help/About Dialog box
let helpAboutHtml = '';
helpAboutHtml += `
<div style="margin: 10px 0px 10px 10px; line-height: 2; font-size: 16px; font-family: playtimewithhottoddiesRg;">
  <div style="padding: 0px 0px 10px 0px;">Interactive network graph visualizing Miraculous Ladybug <br>characters and their transformation relations.</div>
  <table style="padding: 0px 0px 10px 0px;">
    <tr>
      <td style="padding: 0px 10px 0px 0px; font-weight: bold;">GitHub Pages:</td>
      <td><a target="_blank" href="https://hyssopi.github.io/Miraculous-Ladybug-Transformation-Graph/" style="color: #0000EE;">Miraculous Ladybug Transformation Graph</a></td>
    </tr>
    <tr>
      <td style="padding: 0px 10px 0px 0px; font-weight: bold;">Reference link:</td>
      <td>
        <a target="_blank" href="https://miraculousladybug.fandom.com/wiki/Category:Characters" style="color: #0000EE;">Miraculous Ladybug Wiki</a>
      </td>
    </tr>
  </table>
  <table>
    <th colspan="2" class="cellBorder">Controls:</th>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">h</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Show/hide <u>H</u>elp/About dialog</td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">Esc</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;"><u>Clear</u> node/link highlights</td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">Shift / Ctrl</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Hold + left mouse click to <u>multiselect</u></td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">m</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Switch DAG <u>m</u>ode: null, \"radialin\", \"radialout\"</td>
    </tr>
  </table>
</div>
`;
let helpAboutDialog = $(helpAboutHtml).dialog(
{
  dialogClass: 'removeCloseButton',
  title: 'Miraculous Ladybug Transformation Graph',
  width: 'auto',
  height: 'auto',
  position:
  {
    my: "left top",
    at: "left top",
    of: window
  },
  show:
  {
    effect: "drop",
    duration: 100
  },
  hide:
  {
    effect: "drop",
    duration: 500
  },
  closeOnEscape: false
});

// Reading JSON data for network graph
fetch(NETWORK_GRAPH_DATA_JSON_PATH)
  .then(response =>
  {
    if (response.ok)
    {
      return response.json();
    }
    else
    {
      console.error('Configuration was not ok.');
    }
  })
  .then(rawData =>
  {
    console.log(rawData);
    let processedGraphData =
    {
      "nodes": translateNodeData(rawData.nodeData),
      "links": translateEdgeData(rawData.edgeData)
    };
    drawGraph(GRAPH_HTML_CONTAINER_ID, processedGraphData);
  })
  .catch (function(error)
  {
    console.error('Error in fetching: ' + error);
  })

/**
 * Create and return nodes by extracting raw node data.
 *
 * @param rawNodeData List of raw node data
 * @return List of nodes used to create network graph
 */
function translateNodeData(rawNodeData)
{
  let nodes = [];
  // Adding nodes
  for (let i = 0; i < rawNodeData.length; i++)
  {
    let image = new Image();
    image.src = NODE_IMAGE_DIRECTORY_PATH + rawNodeData[i].imageFilename;
    nodes.push({
      "id": rawNodeData[i].id,
      "name": rawNodeData[i].name,
      "label": rawNodeData[i].description,
      "image": image,
      "color": rawNodeData[i].color,
      "group": rawNodeData[i].group
    });
  }
  
  // Printing out all edge relationship combinations between characters for the spreadsheet edges
  let edgeDataSpreadsheetOutput = '';
  for (let i = 0; i < nodes.length; i++)
  {
    for (let j = i; j < nodes.length; j++)
    {
      if (nodes[i].id === nodes[j].id || nodes[i].group.toUpperCase() === 'LOCATION' || nodes[j].group.toUpperCase() === 'LOCATION')
      {
        continue;
      }
      edgeDataSpreadsheetOutput += nodes[i].id + '\t' + nodes[j].id + '\n';
    }
  }
  console.log(edgeDataSpreadsheetOutput);
  
  return nodes;
}

/**
 * Create and return edges by extracting raw edge data.
 *
 * @param rawEdgeData List of raw edge data
 * @return List of edges used to create network graph
 */
function translateEdgeData(rawEdgeData)
{
  let edges = [];
  // Create an edge for all edges
  rawEdgeData.forEach(function(rawEdgeData)
  {
    edges.push({
      "source": rawEdgeData.sourceId,
      "target": rawEdgeData.targetId,
      "shortDescription": rawEdgeData.shortDescription,
      "fullDescriptionHtml": rawEdgeData.fullDescriptionHtml,
      "direction": rawEdgeData.direction.toUpperCase()
    });
  });
  return edges;
}

// How much to scale the node image to be displayed
const GROUP_CHARACTER_IMAGE_SCALE_AMOUNT = 0.03;
const GROUP_LOCATION_IMAGE_SCALE_AMOUNT = 0.03;
// Edge maximum font size
const EDGE_MAXIMUM_FONT_SIZE = 1.3;
// How much opacity unselected nodes/edges are, from 1.0 (full) to 0.0 (transparent)
const UNSELECTED_OPACITY = 0.15;
// How much selected node image size should increase by
const SELECTED_NODE_IMAGE_SIZE_MULTIPLIER = 1.1;
// Relative size of the selectable node area
const NODE_RELATIVE_SIZE = 7.5;
// Offset of the node label
const NODE_LABEL_OFFSET_Y = 8.2;
// Line width of highlighted edges
const HIGHLIGHTED_EDGE_LINE_WIDTH = 6;
// Background color of the container chart background and link label background
const BACKGROUND_COLOR = '#FAEDF0';

const UNSELECTED_OPACITY_HEX = Math.trunc(255 * UNSELECTED_OPACITY).toString(16);

// Reference of the ForceGraph
let graph;
// List of nodes and links to highlight
let highlightNodes = [];
let highlightLinks = [];
let isMultiselect = false;
// Directed acyclic graph (DAG) mode to represent the network graph
let dagMode = null;

/**
 * Uses force-graph to draw the network graph as a HTML canvas using the graphData input.
 *
 * @param graphHtmlContainerId HTML container element ID used to draw the network graph
 * @param graphData Data containing nodes and links used to draw the network graph
 */
function drawGraph(graphHtmlContainerId, graphData)
{
  graph = ForceGraph()(document.getElementById(graphHtmlContainerId))
    .width(window.innerWidth)
    .height(window.innerHeight)
    .backgroundColor(BACKGROUND_COLOR)
    .nodeId('id')
    .nodeLabel(node =>
    {
      // Tooltip pop up when hovering over a node
      let nodeLabelHtml = '';
      if (node.label !== '')
      {
        nodeLabelHtml = `
          <div style="margin: 5px; line-height: 1.5; font-size: 16px; font-family: playtimewithhottoddiesRg; max-width: 300px;">
            ${node.label}
          </div>
        `;
      }
      return nodeLabelHtml;
    })
    .nodeRelSize(NODE_RELATIVE_SIZE)
    .onNodeClick(node =>
    {
      // Reset highlight lists if not multiselecting
      if (!isMultiselect)
      {
        highlightNodes.length = 0;
        highlightLinks.length = 0;
      }
      
      // Find the associated edges of the selected node and add it to the highlight list
      let {links} = graph.graphData();
      let associatedLinks = links.filter(link => link.source === node || link.target === node);
      highlightLinks.push(...associatedLinks);
      
      // Find the associated nodes of the other end of the associated edges and add to the highlight list
      let associatedNodes = [];
      associatedLinks.forEach(function(link)
      {
        if (link.source === node)
        {
          associatedNodes.push(link.target);
        }
        else if (link.target === node)
        {
          associatedNodes.push(link.source);
        }
      });
      highlightNodes.push(...associatedNodes);
      
      // Add the selected node itself to be highlighted
      if (node)
      {
        highlightNodes.push(node);
      }
    })
    .nodeCanvasObject((node, ctx, globalScale) =>
    {
      // Smooth blurry edges when zooming in images
      ctx.imageSmoothingEnabled = true;
      
      let scaledHeight = 400;
      // Scale width with the resize ratio
      let resizeRatio = node.image.naturalHeight / scaledHeight;
      let scaledWidth = node.image.naturalWidth / resizeRatio;
      
      if (node.group.toUpperCase() === 'CHARACTER')
      {
        scaledWidth *= GROUP_CHARACTER_IMAGE_SCALE_AMOUNT;
        scaledHeight *= GROUP_CHARACTER_IMAGE_SCALE_AMOUNT;
      }
      else if (node.group.toUpperCase() === 'LOCATION')
      {
        scaledWidth *= GROUP_LOCATION_IMAGE_SCALE_AMOUNT;
        scaledHeight *= GROUP_LOCATION_IMAGE_SCALE_AMOUNT;
      }
      
      // Slightly increase image size for highlighted nodes
      if (highlightNodes.indexOf(node) !== -1)
      {
        scaledWidth *= SELECTED_NODE_IMAGE_SIZE_MULTIPLIER;
        scaledHeight *= SELECTED_NODE_IMAGE_SIZE_MULTIPLIER;
      }
      
      ctx.save();
      
      // Set node images to full opacity if it is to be highlighted or if the highlight node list is empty.
      // Otherwise set the node images to be partially transparent. This is to help reduce clutter and increase visibility for the highlighted nodes.
      if ((highlightNodes.indexOf(node) !== -1) || (highlightNodes.length === 0))
      {
        ctx.globalAlpha = 1.0;
      }
      else
      {
        ctx.globalAlpha = UNSELECTED_OPACITY;
      }
      
      ctx.drawImage(node.image, node.x - scaledWidth / 2, node.y - scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
      
      if (node.name)
      {
        let label = node.name;
        // Zoom out: globalScale is smaller (<1), Zoom in: globalScale is bigger (>40)
        let fontSize = ((6 / globalScale) < 2.5) ? 2.5 : (6 / globalScale);
        ctx.font = ((highlightNodes.indexOf(node) !== -1) ? 'bold' : '') + ` ${fontSize}px Lobster`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if ((highlightNodes.indexOf(node) !== -1) || (highlightNodes.length === 0))
        {
          ctx.fillStyle = 'black';
        }
        else
        {
          ctx.fillStyle = '#000000' + UNSELECTED_OPACITY_HEX;
        }
        ctx.fillText(label, node.x, node.y + NODE_LABEL_OFFSET_Y);
      }
    })
    .linkDirectionalArrowRelPos(1)
    .linkDirectionalArrowLength(function(link)
    {
      if (link.direction.toUpperCase() !== 'DIRECTED')
      {
        return 0;
      }
      else if (highlightLinks.indexOf(link) !== -1)
      {
        return 4.0;
      }
      else
      {
        return 2.5;
      }
    })
    .linkDirectionalArrowColor(function(link)
    {
      let linkArrowColor = link.target.color;
      if ((highlightLinks.indexOf(link) === -1) && (highlightLinks.length !== 0))
      {
        linkArrowColor += UNSELECTED_OPACITY_HEX;
      }
      return linkArrowColor;
    })
    .linkLabel(function(link)
    {
      if (link.fullDescriptionHtml === '')
      {
        return;
      }
      
      // Tooltip pop up when hovering over a link
      if ((highlightLinks.indexOf(link) !== -1) || (highlightLinks.length === 0))
      {
        return `
          <div style="margin: 5px; line-height: 1.5; font-size: 20px; font-family: playtimewithhottoddiesRg;">
            ${link.fullDescriptionHtml}
          </div>
        `;
      }
    })
    .linkCanvasObject((link, ctx, globalScale) =>
    {
      // Ignore unbound links
      if (typeof link.source !== 'object' || typeof link.target !== 'object')
      {
        return;
      }
      
      // Draw link line
      let lineGradient = ctx.createLinearGradient(link.source.x, link.source.y, link.target.x, link.target.y);
      if ((highlightLinks.indexOf(link) !== -1) || (highlightLinks.length === 0))
      {
        lineGradient.addColorStop(0, link.source.color);
        lineGradient.addColorStop(1, link.target.color);
      }
      else
      {
        lineGradient.addColorStop(0, link.source.color + UNSELECTED_OPACITY_HEX);
        lineGradient.addColorStop(1, link.target.color + UNSELECTED_OPACITY_HEX);
      }

      ctx.beginPath();
      ctx.strokeStyle = lineGradient;
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      ctx.lineWidth = (highlightLinks.indexOf(link) === -1) ? 1 / globalScale : HIGHLIGHTED_EDGE_LINE_WIDTH / globalScale;
      
      ctx.save();
      ctx.stroke();
      
      // Set links to be partially transparent if not selected to be highlighted and with a non-empty highlight link list
      if ((highlightLinks.indexOf(link) !== -1) || (highlightLinks.length === 0))
      {
        ctx.globalAlpha = 1.0;
      }
      else
      {
        ctx.globalAlpha = UNSELECTED_OPACITY;
      }
      
      ctx.restore();
      
      // Display link name
      if ((highlightLinks.indexOf(link) !== -1) || (highlightLinks.length === 0))
      {
        // Extra margin spacing between edge text
        let labelNodeMargin = graph.nodeRelSize() * 0;
        
        // Calculate label positioning
        let textPosition = Object.assign(...['x', 'y'].map(c =>
        ({
          // Calculate middle point
          [c]: link.source[c] + (link.target[c] - link.source[c]) / 2
        })));
        
        let relLink =
        {
          x: link.target.x - link.source.x,
          y: link.target.y - link.source.y
        };
        
        let maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - labelNodeMargin * 2;
        
        let textAngle = Math.atan2(relLink.y, relLink.x);
        // Maintain label vertical orientation for legibility
        if (textAngle > Math.PI / 2)
        {
          textAngle = -(Math.PI - textAngle);
        }
        if (textAngle < -Math.PI / 2)
        {
          textAngle = -(-Math.PI - textAngle);
        }
        
        let label = `${link.shortDescription}`;
        if (label !== '')
        {
          // Estimate font size to fit in link length
          ctx.font = '1px playtimewithhottoddiesRg';
          let fontSize = Math.min(EDGE_MAXIMUM_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
          ctx.font = `${fontSize}px playtimewithhottoddiesRg`;
          let textWidth = ctx.measureText(label).width;
          let backgroundDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
          
          // Draw text label (with background rectangle)
          ctx.save();
          ctx.translate(textPosition.x, textPosition.y);
          ctx.rotate(textAngle);
          
          ctx.fillStyle = BACKGROUND_COLOR + (Math.trunc(255 * 0.8)).toString(16);
          ctx.fillRect(-backgroundDimensions[0] / 2, -backgroundDimensions[1] / 2, ...backgroundDimensions);
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'black';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }
    })
    .dagLevelDistance(30)
    .zoom(4.0, 0)
    .graphData(graphData)
}

// Prevent default behavior of right click mouse button
document.addEventListener('contextmenu', function(event)
{
  event.preventDefault();
});

// Add key listeners for when user presses key and when user lifts key
window.addEventListener("keydown", keydownResponse, false);
window.addEventListener("keyup", keyupResponse, false);

/**
 * Behavior when key button on keyboard is first pressed down.
 *
 * @param event Key activity event
 */
function keydownResponse(event)
{
  if (event.keyCode === 27)
  {
    // ESC button pressed
    highlightNodes.length = 0;
    highlightLinks.length = 0;
  }
  if (event.keyCode === 16 || event.keyCode === 17)
  {
    // Shift or Ctrl button pressed
    isMultiselect = true;
  }
  if (event.keyCode === 72)
  {
    // 'h' button pressed
    toggleHelpAboutPopUp(helpAboutDialog);
  }
  if (event.keyCode === 77)
  {
    // 'm' button pressed
    if (dagMode === null)
    {
      dagMode = 'radialin';
    }
    else if (dagMode === 'radialin')
    {
      dagMode = 'radialout';
    }
    else if (dagMode === 'radialout')
    {
      dagMode = null;
    }
    graph.dagMode(dagMode);
  }
}

/**
 * Behavior when key button on keyboard is lifted up.
 *
 * @param event Key activity event
 */
function keyupResponse(event)
{
  if (event.keyCode === 16 || event.keyCode === 17)
  {
    // Shift or Ctrl button lifted
    isMultiselect = false;
  }
}

/**
 * Show/hide the Help/About dialog pop-up.
 *
 * @param helpAboutDialog Reference to the jQuery UI dialog
 */
function toggleHelpAboutPopUp(helpAboutDialog)
{
  if ($(helpAboutDialog).dialog('isOpen'))
  {
    $(helpAboutDialog).dialog('close');
  }
  else
  {
    $(helpAboutDialog).dialog('open');
  }
}
