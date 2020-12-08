import { select } from "d3-selection";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import React, { useEffect, useRef } from 'react';

import { tick } from './events';
import { addDrag, addHoverOpacity, addZoom } from './interactions';

// TODO: make component independent of restProps
// TODO: handle error when line is not <line>
// TODO: add centering node on click
// TODO: split to separate useEffects and useState

// if you'll try do develop package locally with 'npm link'
// probably you will get error 'Invalid hook call.'
// see https://github.com/facebook/react/issues/15315#issuecomment-479802153

// so better fork and/or use branch name in package.json dependencies like so:
// "react-graph-network": "github:AlyonaShadrina/react-graph-network#<branch>"
// dont't forget to `rm -rf ./node_modules/react-graph-network`, maybe clear your package.json and `npm i`
const loaderStyle = {
    width: "100%",
    height: "100%",
    background: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
}

const Graph = ({
    data,
    nodeDistance,
    NodeComponent,
    LineComponent,
    pullIn,
    zoomDepth,
    enableZoomOut,
    enableDrag,
    hoverOpacity,
    animateNodes,
    LoaderComponent,
    collisionRadius,
    nodeRadius,
    id = 'GraphTree_container',
    ...restProps
}) => {
    useEffect(() => {

        if (!data) {
            return null
        }

        const svg = select(`#${id}`);
        const link = svg.selectAll("._graphLine").data(data.links);
        const node = svg.selectAll("._graphNode").data(data.nodes);
        select("._loaderContainer").style("display", undefined);
        select("._graphZoom").attr("transform", undefined);

        const collideRadius = collisionRadius < nodeRadius ? nodeRadius : collisionRadius

        const simulation = forceSimulation(data.nodes)
            .force("link", forceLink()                                 // This force provides links between nodes
                .id(function(d) { return d.id; })                      // This provide the id of a node
                .links(data.links)                                     // and this the list of links
            )
            .force("charge", forceManyBody().strength(-1 * nodeDistance))          // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", forceCenter(
                svg._groups[0][0].parentElement.clientWidth / 2,
                svg._groups[0][0].parentElement.clientHeight / 2
            ))                                                         // This force attracts nodes to the center of the svg area
            .force("collide", forceCollide(collideRadius))
            .on("tick", () => tick(node, link))                        // https://github.com/d3/d3-force#simulation_tick
            .on("end", animateNodes ? null : () => {
            node.each(function(d) {
                d.fx = d.x;
                d.fy = d.y;
            });
            select("._loaderContainer").style("display", "none")
        })

        // add interactions
        addZoom(svg, zoomDepth, enableZoomOut);
        addHoverOpacity(node, link, hoverOpacity);
        addDrag(node, simulation, enableDrag, pullIn);

    }, [data, nodeDistance, NodeComponent, LineComponent, pullIn, zoomDepth, enableZoomOut, enableDrag, hoverOpacity, animateNodes, LoaderComponent, collisionRadius, nodeRadius]);

    if (!data) {
        return null
    }

    return (
        <svg id={id} width="100%" height="100%" {...restProps}>
            <g className="_graphZoom">
                {
                    data.links.map((link, i) => {
                        return LineComponent
                            ? <LineComponent link={link} key={i} className="_graphLine"/>
                            : <line stroke="grey" key={i} className="_graphLine" />
                    })
                }
                {
                    data.nodes.map((node, i) => {
                        return (
                            <g key={i} className="_graphNode">
                                {
                                    NodeComponent
                                        ? <NodeComponent node={node} nodeRadius={nodeRadius}/>
                                        : <circle fill="black" r={nodeRadius} />
                                }
                            </g>
                        )
                    })
                }
                {!animateNodes && (
                    <foreignObject className="_loaderContainer" width="100%" height="100%">
                        {LoaderComponent ? <LoaderComponent nodes={data.nodes}/> : <div style={loaderStyle}>Plotting...</div> }
                    </foreignObject>
                )}
            </g>
        </svg>
    )
};

Graph.defaultProps = {
    nodeDistance: 100,
    zoomDepth: 0,
    enableZoomOut: false,
    hoverOpacity: 1,
    animateNodes: true,
    collisionRadius: 0,
    nodeRadius: 10
};

export default Graph;
