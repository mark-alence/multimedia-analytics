import "./App.css";
import React, { useState, useEffect, useRef } from "react";

function Overlay(props) {
  return (
    <div className="overlay-container">
      <div className="overlay-left">
        {
          <OverlayImage
            side="left"
            src={props.imageLeft.src}
            heading={props.imageLeft.heading}
          />
        }
      </div>
      <div className="overlay-right">
        {props.imagesRight.map((e) => (
          <OverlayImage
            src={e.src}
            heading={e.heading}
            class="overlay-right-image"
            side="right"
          />
        ))}
      </div>
    </div>
  );
}

function OverlayImage(props) {
  return (
    <div className="overlay-image-container">
      <img
        src={props.src}
        alt={props.heading}
        className={`overlay-${props.side}-image`}
      />
      {props.heading}
    </div>
  );
}

export default Overlay;
