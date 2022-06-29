import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import CircularProgress from '@mui/material/CircularProgress';


import Gallery from "react-grid-gallery";

function Overlay(props) {
  const [height, setHeight] = useState(180);
  const left = useRef(null);

  // useEffect(() => {
  //   setHeight(left.current.offsetHeight / 2);
  // }, [left]);

  return (
    <div className="overlay-container">
      {!props.loading ? (
        <div className="text-container">
          To view images similar to this one, click Proceed. You can return to
          the current subset by pressing the replay button in the sidebar.
          <div className="overlay-button-container">
            <button
              className="overlay-button"
              onClick={() => props.onProceed()}
            >
              Proceed
            </button>
            <button className="overlay-button" onClick={() => props.onCancel()}>
              Cancel
            </button>
          </div>
        </div>
      ) : <CircularProgress/>}
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
