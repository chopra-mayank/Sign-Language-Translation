import React, { useState, useEffect } from "react";
import { PoseViewer } from "react-pose-viewer";

const CustomPoseViewer = ({ src }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setIsLoading(false);
    }
  }, [src]);

  return <div>{isLoading ? <div>Loading...</div> : <PoseViewer src={src} loop autoplay thickness={2} />}</div>;
};

export default CustomPoseViewer;
