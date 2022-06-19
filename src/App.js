import "./App.css";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import Gallery from "react-grid-gallery";

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
                console.log(e);
                e.preventDefault();
                setFilters({ ...filters, date: e.target[0].value });
              }}
            >
              <label>
                Year: <input type="number" />
              </label>
            </form>

            <Select
              options={artistOptions}
              onChange={(e) => {
                setFilters({ ...filters, artist_name: e.value });
              }}
              isSearchable={true}
            />
          </div>

          <div>
            {typeof data.names === "undefined" ? (
              <p>Loading images...</p>
            ) : (
              <Gallery images={data.names} />
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
