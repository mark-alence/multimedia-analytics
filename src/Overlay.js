import "./App.css";
import React, { useState, useEffect, useRef } from "react";

import Gallery from "react-grid-gallery";

function Overlay(props) {
  const [height, setHeight] = useState(180);
  const left = useRef(null);

  // useEffect(() => {
  //   setHeight(left.current.offsetHeight / 2);
  // }, [left]);

  return (
    <div className="overlay-container">
      <div ref={left} className="overlay-left">
        {props.imageLeft && (
          <OverlayImage
            side="left"
            src={props.imageLeft.src}
            heading={props.imageLeft.heading}
          />
        )}
      </div>
      <div className="overlay-right">
        <div class="row" style={{ fontSize: 20, justifyContent: "center" }}>
          Most Similar Images
        </div>
        <div style={{ flex: 1, maxHeight: "40%" }}>
          <div className="grid-container-overlay">
            {props.imagesRight && (
              <Gallery
                images={props.imagesRight}
                maxRows={1}
                rowHeight={height}
              />
            )}
          </div>
        </div>
        <div className="row" />
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
