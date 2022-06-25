import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Switch, FormControlLabel, Button } from "@mui/material";
import Select from "react-select";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";

function prettyString(str) {
  if (typeof str === "string") {
    str = str.replaceAll("-", " ");
    str = str.replaceAll("_", " ");
    str = str.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  }
  return str;
}

const levelOptions = ["date", "style", "media", "artist_name", "tags"];

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    borderBottom: "1px solid grey",
    color: state.isSelected ? "blue" : "black",
    padding: 5,
  }),
  container: (provided, state) => ({
    ...provided,
    width: "90%",
    minWidth: "90%",
  }),
  control: (provided, state) => ({
    ...provided,
    width: "90%",
    minWidth: "90%",
  }),
  valueContainer: (provided, state) => ({ ...provided, padding: 0 }),
};

function SideBar(props) {
  const [filterOptions, setFilterOptions] = useState({});
  const [levels, setLevels] = useState(["date", "style", "media"]);

  useEffect(() => {
    fetch("/filter_options").then((res) =>
      res.json().then((data) => {
        let options = {};
        for (const key in data.payload) {
          options[key] = data.payload[key].map((e) => {
            return {
              value: e,
              label: prettyString(e),
            };
          });
        }
        setFilterOptions(options);
      })
    );
  }, []);

  useEffect(() => {
    console.log(levels)
    props.onLevelChange(levels);
  }, [levels]);

  return (
    <div className="sidebar-container">
      <div className="sidebar-buttons">
        <FilterListOffIcon
          className="filter-icon"
          onClick={() => {
            props.clearFilters();
          }}
        />
        <div className="switch-container">
          <label>Carousel</label>
          <Switch onChange={() => props.onSwitch()} />
          <label>Grid</label>
        </div>
      </div>
      <div className="select-group">
        {Object.keys(filterOptions).map((option) => {
          return (
            <div className="box">
              <div className="select-container" key={option}>
                <p className="select-text">{prettyString(option)}:</p>
                <FormControlLabel
                  className="select"
                  style={{ paddingBottom: 5, margin: 0, width: "90%" }}
                  control={
                    <Select
                      styles={customStyles}
                      value={
                        props.filters[option] === undefined
                          ? ""
                          : {
                              value: props.filters[option],
                              label: prettyString(props.filters[option]),
                            }
                      }
                      options={filterOptions[option]}
                      onChange={(e) => {
                        props.onChange({ ...e, filter: option });
                      }}
                      isSearchable={true}
                    />
                  }
                />
              </div>
              {/* <Button className="clear-button" onClick={() => props.onClear(option)}>Clear</Button> */}
            </div>
          );
        })}
      </div>
      <div className="circle-group">
        {levelOptions.map((e) => {
          let isActive = levels.includes(e);
          return (
            <div className="circle-container">
              <div
                className="circle"
                style={{ opacity: isActive ? 1 : 0.5 }}
                onClick={(event) => {
                  event.preventDefault();
                  if (levels.includes(e)) {
                    setLevels((prev) => prev.filter((i) => i !== e));
                  } else {
                    setLevels((prev) => [...prev, e]);
                  }
                }}
              >
                {prettyString(e).split(" ")[0]}
              </div>
              {isActive ? levels.indexOf(e) + 1 : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SideBar;
