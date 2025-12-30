import React, { useContext, useState, useEffect } from "react";
import SearchBar from "../../components/student/SearchBar";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import CourseCard from "../../components/student/CourseCard";
import { assets } from "../../assets/assets";
import Footer from "../../components/student/Footer";

const CoursesList = () => {
  const { navigate, allCourses, calculateRating } = useContext(AppContext);
  const { input } = useParams();
  const [filteredCourse, setFilteredCourse] = useState([]);
  const [sortBy, setSortBy] = useState("none");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      let tempCourses = allCourses.slice();

      // text search
      if (input) {
        tempCourses = tempCourses.filter((item) =>
          item.courseTitle.toLowerCase().includes(input.toLowerCase())
        );
      }

      // sorting
      const finalPrice = (c) =>
        (Number(c.coursePrice) || 0) * (1 - (Number(c.discount) || 0) / 100);

      switch (sortBy) {
        case "price-asc":
          tempCourses.sort((a, b) => finalPrice(a) - finalPrice(b));
          break;
        case "price-desc":
          tempCourses.sort((a, b) => finalPrice(b) - finalPrice(a));
          break;
        case "newest":
          tempCourses.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          break;
        case "rating-avg":
          tempCourses.sort(
            (a, b) => (calculateRating(b) || 0) - (calculateRating(a) || 0)
          );
          break;
        case "rating-count":
          tempCourses.sort(
            (a, b) =>
              (b.courseRatings?.length || 0) - (a.courseRatings?.length || 0)
          );
          break;
        default:
          break;
      }

      setFilteredCourse(tempCourses);
      setCurrentPage(1);
    }
  }, [allCourses, input, sortBy, calculateRating]);

  // Clamp current page when filtered results change
  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filteredCourse.length / ITEMS_PER_PAGE));
    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [filteredCourse, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCourse.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCourses = filteredCourse.slice(startIndex, endIndex);

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left">
        <div className="flex md:flex-row flex-col gap-6 items-start justify-between w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">
              Course List
            </h1>
            <p className="text-gray-500">
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Home
              </span>{" "}
              / <span>Course List</span>
            </p>
          </div>
          {/* Search + Filters */}
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <SearchBar data={input} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-500/30 rounded px-3 py-2 text-gray-700 bg-white"
              aria-label="Filter results"
            >
              <option value="none">Default</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
              <option value="newest">Recently added</option>
              <option value="rating-avg">Rating: average score</option>
              <option value="rating-count">Rating: number of reviews</option>
            </select>
          </div>
        </div>
        {input && (
          <div className="inline-flex items-center gap-4 px-4 py-2 border mt-8-mb-8 text-gray-600">
            <p>{input}</p>
            <img
              src={assets.cross_icon}
              alt=""
              className="cursor-pointer"
              onClick={() => navigate("/course-list")}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 my-16 px-2 md:p-0">
          {paginatedCourses.map((course, index) => (
            <CourseCard key={index} course={course} />
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-2 md:p-0 mb-16">
          <p className="text-sm text-gray-600">
            Showing {filteredCourse.length === 0 ? 0 : startIndex + 1}–
            {Math.min(endIndex, filteredCourse.length)} of {filteredCourse.length} results
          </p>
          <div className="flex items-center gap-2" aria-label="Pagination navigation">
            <button
              className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  className={`px-3 py-2 border rounded ${
                    isActive ? "bg-blue-600 text-white border-blue-600" : "text-gray-700"
                  }`}
                  onClick={() => setCurrentPage(page)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;
