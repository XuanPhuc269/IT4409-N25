import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const [allCourses, setAllCourses] = useState([])
    
    const {getToken} = useAuth();
    const {user} = useUser();
    

    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses)
    }

    const calculateRating = (course) => {
        if (course.courseRatings.length === 0) {
            return 0
        }

        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return totalRating / course.courseRatings.length
    }
    
    useEffect(() => {
        fetchAllCourses(dummyCourses)
    }, [])

    const logToken = async () => {
        const token = await getToken();
        console.log("Clerk Token: ", token);
    }

    useEffect(() => {
        if (user) {
            logToken();
        } else {
            console.log("No user signed in");
        }
    },[user])

    const value = {
        allCourses, calculateRating
    }


    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}