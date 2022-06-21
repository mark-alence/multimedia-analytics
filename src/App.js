import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Gallery from "react-grid-gallery";
import Coverflow from "react-coverflow";
import { StyleRoot } from "radium";
import { Switch, FormControlLabel } from "@mui/material";

function getQueryString(filters) {
  let str = "?";
  for (const property in filters) {
    str += property + "=" + filters[property] + "&";
  }
  str = str.slice(0, -1);
  return str;
}

function prettyString(str) {
  str = str.replaceAll("-", " ");
  str = str.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  return str;
}

function App() {
  const [data, setData] = useState([{}]);
  const [filters, setFilters] = useState({});
  const [artistOptions, setArtistOptions] = useState([]);
  const [isGrid, setIsGrid] = useState(true);

  useEffect(() => {
    fetch("/artists").then((res) =>
      res.json().then((data) => {
        let options = data.names.map((e) => {
          return { value: e, label: prettyString(e) };
        });
        setArtistOptions(options);
      })
    );
  }, []);

  useEffect(() => {
    let queryString = getQueryString(filters);
    if (queryString !== "") {
      fetch(`/filtered_images${queryString}`).then((res) =>
        res.json().then((data) => {
          setData(data);
        })
      );
    }
  }, [filters]);

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ color: "black", width: "100%" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFilters({ ...filters, date: e.target[0].value });
              }}
            >
              <label>
                Year: <input type="number" />
              </label>
            </form>

            <FormControlLabel
              control={
                <Select
                  options={artistOptions}
                  onChange={(e) => {
                    setFilters({ ...filters, artist_name: e.value });
                  }}
                  isSearchable={true}
                />
              }
              label="Grid View"
            />

            <Switch
              label="Gird View"
              checked={isGrid}
              onChange={() => {
                setIsGrid(!isGrid);
              }}
            />
          </div>

          <div className="carousel-container">
            {typeof data.names === "undefined" ? (
              <p>Loading images...</p>
            ) : isGrid ? (
              <Gallery images={data.names} maxRows={1} />
            ) : (
              <StyleRoot>
                <Coverflow
                  width="100%"
                  height="250"
                  displayQuantityOfSide={2}
                  enableHeading={true}
                  infiniteScroll={true}
                >
                  {data.names.map((e, i) => (
                    <img
                      resizeMode="contain"
                      width="3vw"
                      src={e.src}
                      key={i}
                      alt={e.heading}
                    />
                  ))}
                </Coverflow>
              </StyleRoot>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
