/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * HexGrid
 *
 * Component to display a hex grid.
 * Reference: https://www.redblobgames.com/grids/hexagons/.
 *
 * We use cube co-ordinates (see reference).
 *
 * Props:
 *   levels     - The number of levels around the central hex.
 *   style      - CSS style of the HTML element.
 *
 * Usage:
 *
 * <HexGrid levels={5}>
 *   <Token x={0} y={0} z={0}/>
 * </HexGrid>
 */
export class HexGrid extends React.Component {
  static propTypes = {
    levels: PropTypes.number.isRequired,
    outline: PropTypes.bool,
    style: PropTypes.object,
    range: PropTypes.number,
    colorMap: PropTypes.object,
    cellSize: PropTypes.number,
    onClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element,
    ]),
  };

  constructor(props) {
    super(props);
    this.state = {
      colorMap: this.props.colorMap,
    }
  }

  static defaultProps = {
    levels: 5,
    colorMap: {},
    outline: true,
    cellSize: 1,
    range: 3,
    style: {transform: 'perspective(600px) translateZ(0px) rotateX(36deg)'}
  };

  _getCellColor(x, y, z) {
    const key = `${x},${y},${z}`;
    let color = 'white';
    if (key in this.state.colorMap) {
      color = this.state.colorMap[key];
      // console.warn(`getCellColor: ${key}, color:${color}`)
    }
    return color;
  }

  _getGrid() {
    if (!this.props.outline) {
      return null;
    }

    let hexes = [];
    const r = this.props.levels;
    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        const z = -x - y;
        if (Math.abs(z) > r) continue;
        hexes.push(
          <Hex
            key={`${x}:${y}:${z}`}
            style={{ fill: this._getCellColor(x, y, z) }}
            x={x}
            y={y}
            z={z}
            size={this.props.cellSize}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseOut={this.onMouseOut}
          />
        );
      }
    }
    // this.setState({colorMap: {}});
    return hexes;
  }

  _getNearGrids(args, range) {
    console.warn(`args: ${args['x']}, ${args['y']}, ${args['z']}, range: ${range}`);
    const {x, y, z} = args;
    let results = [];
    for (let dx = - range; dx < range + 1; dx++) {
      const minDy = Math.max(-range, -dx - range);
      const maxDy = Math.min(range, -dx + range);
      for (let dy = minDy; dy < maxDy + 1; dy++) {
        results.push({x:x + dx, y:y + dy, z:-x - y - dx -dy});
      }
    }
    results.push(args);
    return results;
  }

  _highlightNeighbor(colorMap) {
    this.setState({colorMap: colorMap});
  }

  componentWillMount() {
    let tokens = this.props.children; // React.element..{props,}
    const highlightRange = this.getLimitNeighbors(tokens, this.props.range);
    this._highlightNeighbor(highlightRange);
    console.log(`component will mount.. tokenX: ${tokens.x}`);
  }

  getLimitNeighbors(center, range = 3) {
    if (center) {
      const ret = this._getNearGrids(center,range);
      let colorMap = {};
      ret.map((grid) => {
        const key = `${grid.x},${grid.y},${grid.z}`;
        colorMap[key] = '#22ff66';
        // console.warn(`current colorMap key: ${key}`)
      });
      return colorMap;
    }
  }

  inRange(target, center, range) {
    const coordinate = `${target.x},${target.y},${target.z}`;
    const neighbors = this.getLimitNeighbors(center, range);
    if (coordinate in neighbors) 
      return true;
    else
      return false;
  }

  componentDidUpdate() {
  }

  onClick = args => {
    if (this.props.onClick) {
      // tokens included by Hexgrids..
      let tokens = this.props.children; // React.element..{props,}
      if (this.inRange(args, tokens.props, this.props.range)) {
        const highlightRange = this.getLimitNeighbors(args, this.props.range);
        this._highlightNeighbor(highlightRange);
        this.props.onClick(args); // args from clicked Hex.
      }
    }
  };

  onMouseOver = args => {
    if (this.props.onMouseOver) {
      this.props.onMouseOver(args);
    }
  };

  onMouseOut = args => {
    if (this.props.onMouseOut) {
      this.props.onMouseOut(args);
    }
  };

  render() {
    const tokens = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        _inHexGrid: true,
        onClick: this.onClick,
        onMouseOver: this.onMouseOver,
        onMouseOut: this.onMouseOut,
      });
    });

    const t = this.props.cellSize * this.props.levels * 2;
    return (
      <svg
        viewBox={-t + ' ' + -t + ' ' + 2 * t + ' ' + 2 * t}
        style={this.props.style}
      >
        <g>{this._getGrid()}</g>
        {tokens}
      </svg>
    );
  }
}

/**
 * Hex (flat-topped).
 *
 * Component that renders a hexagon inside a HexGrid.
 *
 * Props:
 *   x       - X coordinate (cube coordinates).
 *   y       - Y coordinate (cube coordinates).
 *   z       - Z coordinate (cube coordinates).
 *   size    - Hex size.
 *   style   - Custom styling.
 *   onClick - Invoked when a Hex is clicked.
 *   onMouseOver - Invoked when a Hex is mouse over.
 *   onMouseOut - Invoked when a Hex is mouse out.
 *
 * Not meant to be used by the end user directly (use Token).
 * Also not exposed in the NPM.
 */
export class Hex extends React.Component {
  static propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
    size: PropTypes.number,
    style: PropTypes.any,
    onClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func,
    children: PropTypes.element,
  };

  static defaultProps = {
    size: 1,
    x: 0,
    y: 0,
    z: 0,
    style: { fill: '#fff' },
  };

  constructor(props) {
    super(props);
  }

  get width() {
    return this.props.size * 2;
  }

  get height() {
    return (Math.sqrt(3) / 2 * this.width).toFixed(3);
  }

  /**
   * Get the co-ordinates of the hex center.
   */
  get center() {
    const q = this.props.x;
    const r = this.props.z;
    const x = this.props.size * 3 * q / 2.0;
    const y = this.props.size * Math.sqrt(3) * (r + q / 2.0);
    return { x, y };
  }

  /**
   * Get the points of the vertices.
   */
  get points() {
    //   b____c
    //   /    \
    // a/      \d
    //  \      /
    //   \____/
    //   f    e

    const s = this.props.size;
    const h = this.height;

    const xa = -s;
    const xb = -s / 2.0;
    const xc = +s / 2.0;
    const xd = +s;
    const xe = xc;
    const xf = xb;

    const ya = 0.0;
    const yb = h / 2.0;
    const yc = yb;
    const yd = ya;
    const ye = -h / 2.0;
    const yf = ye;

    const flatTop = [
      `${xa},${ya}`,
      `${xb},${yb}`,
      `${xc},${yc}`,
      `${xd},${yd}`,
      `${xe},${ye}`,
      `${xf},${yf}`,
    ];

    return flatTop.join(' ');
  }

  onClick = () => {
    this.props.onClick({
      x: this.props.x,
      y: this.props.y,
      z: this.props.z,
    });
  };

  onMouseOver = () => {
    this.props.onMouseOver({
      x: this.props.x,
      y: this.props.y,
      z: this.props.z,
    });
  };

  onMouseOut = () => {
    this.props.onMouseOut({
      x: this.props.x,
      y: this.props.y,
      z: this.props.z,
    });
  };

  render() {
    const tx = this.center.x;
    const ty = this.center.y;

    // If a child is passed, render child.
    if (this.props.children) {
      console.log(`in Hex render, if token exists..X:${this.props.x}`);
      return (
        <g
          onClick={this.onClick}
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
          transform={`translate(${tx}, ${ty})`}
        >
          {this.props.children}
        </g>
      );
    }

    // If no child, render a hex.
    return (
      <g
        onClick={this.onClick}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        transform={`translate(${tx}, ${ty})`}
      >
        <polygon
          style={this.props.style}
          points={this.points}
          stroke="#aaa"
          strokeWidth={0.01}
        />
        <text fontSize='.4' x='-.5'>{this.props.x.toFixed(0)},{this.props.y.toFixed(0)},{this.props.z.toFixed(0)}</text>
      </g>
    );
  }
}
