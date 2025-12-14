import { createContext } from "react";
import { dummyCourses } from "../assets/assets"; 
export const AppContext = createContext();

export const AppContextProvider = (props) => {
    
    const value = {
        isEducator: true,
        currency: "$",
        allCourses: dummyCourses,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}