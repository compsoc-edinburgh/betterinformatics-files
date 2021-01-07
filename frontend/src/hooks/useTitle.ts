import { useEffect } from "react";
import serverData from "../utils/server-data";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = `${
      serverData.title_prefix ? `${serverData.title_prefix} ` : ""
    }${title}${serverData.title_suffix ? ` ${serverData.title_suffix}` : ""}`;
  }, [title]);
};

export default useTitle;
