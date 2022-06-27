function prettyString(str) {
    if (typeof str === "string") {
      str = str.replaceAll("-", " ");
      str = str.replaceAll("_", " ");
      str = str.replaceAll(",", " ");
  
      str = str.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
    }
    return str;
  }
  
  export {prettyString}