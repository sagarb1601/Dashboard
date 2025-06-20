import React from "react";

const LookerStudioEmbed = () => {
  return (
    <div style={{ width: "100%", height: "600px", borderRadius: "12px", overflow: "hidden" }}>
      {/* <iframe
        title="Looker Studio Dashboard"
        width="100%"
        height="100%"
        src=""
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen
      ></iframe> */}
      

      <iframe
      style={{ width: "100%", height: "100%", border: "none" }}
        title="Dashboard"
        src="http://localhost:3030/public/dashboard/7fc46e65-20ed-42ce-8198-6ff19160d8f3"
        frameBorder="0"
        width="100%"
        height="100%"
        allowFullScreen
      ></iframe>

      
</div>

  );
};

export default LookerStudioEmbed;
