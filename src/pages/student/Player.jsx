import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import CourseQnA from "../../components/student/CourseQ&A";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";
import axios from "axios";

const Player = () => {
  const { enrolledCourses, calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNumberOfLectures,
    currency, getToken, userData, fetchUserEnrolledCourses, requireAuth } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);


  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings.map((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating)
          }
        })
      }
    })
  };


  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  useEffect(() => {
    if (userData && courseId) {
      getCourseProgress();
    }
  }, [userData, courseId]);

  const markLectureAsCompleted = async (lectureId) => {
    if (!requireAuth()) return;
    try {
      // Optimistic update
      setProgressData((prev) => {
        const completed = new Set((prev?.lectureCompleted || []).map(String));
        completed.add(String(lectureId));
        return { ...(prev || { courseId, lectureCompleted: [] }), lectureCompleted: Array.from(completed) };
      });

      advanceToNextLecture();

      const token = await getToken();
      const { data } = await axios.post('/api/user/update-course-progress', { courseId, lectureId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        // Refetch progress after successful update to ensure data consistency
        await getCourseProgress();
      } else {
        toast.error(data.message);
        // Revert on failure
        setProgressData((prev) => {
          const completed = new Set((prev?.lectureCompleted || []).map(String));
          completed.delete(String(lectureId));
          return { ...prev, lectureCompleted: Array.from(completed) };
        });
      }
    } catch (error) {
      toast.error(error.message);
      // Revert on error
      setProgressData((prev) => {
        const completed = new Set((prev?.lectureCompleted || []).map(String));
        completed.delete(String(lectureId));
        return { ...prev, lectureCompleted: Array.from(completed) };
      });
    }
  }

  const getCourseProgress = async () => {
    if (!userData) return;
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/user/get-course-progress`, { courseId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const isLectureCompleted = (lectureId) => {
    const id = String(lectureId).trim();
    const completed = (progressData?.lectureCompleted || []).map((x) => String(x).trim());
    return completed.includes(id);
  };

  const advanceToNextLecture = () => {
    if (!courseData || !playerData) return;
    const currentChapterIdx = (playerData.chapter || 1) - 1;
    const currentLectureIdx = (playerData.lecture || 1) - 1;

    const chapters = courseData.courseContent || [];
    if (!chapters[currentChapterIdx]) return;

    const currentChapter = chapters[currentChapterIdx];
    const lectures = currentChapter.chapterContent || [];

    if (currentLectureIdx + 1 < lectures.length) {
      const nextLecture = lectures[currentLectureIdx + 1];
      setPlayerData({ ...nextLecture, chapter: currentChapterIdx + 1, lecture: currentLectureIdx + 2 });
      return;
    }

    if (currentChapterIdx + 1 < chapters.length) {
      const nextChapter = chapters[currentChapterIdx + 1];
      if (nextChapter && nextChapter.chapterContent && nextChapter.chapterContent.length > 0) {
        const firstLecture = nextChapter.chapterContent[0];
        setPlayerData({ ...firstLecture, chapter: currentChapterIdx + 2, lecture: 1 });
        return;
      }
    }

    toast.info("You've completed all lectures in this course.");
  };

  const handleRate = async (rating) => {
    if (!requireAuth()) return;
    try {
      const token = await getToken();
      const { data } = await axios.post('/api/course/add-rating', {
        courseId,
        rating
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const youtubeOpts = {
    height: "600px",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1
    },
  };

  const courseStructure = (
    <div className="flex-1 overflow-y-auto max-h-[80vh] custom-scrollbar">
      {courseData &&
        courseData.courseContent.map((chapter, index) => (
          <div
            key={index}
            className="border border-gray-300 bg-white mb-2 rounded"
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
              onClick={() => toggleSection(index)}
            >
              <div className="flex items-center gap-2">
                <img
                  className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`}
                  src={assets.down_arrow_icon}
                  alt="toggle_section"
                />
                <p className="font-medium md:text-base text-sm">
                  {chapter.chapterTitle}
                </p>
              </div>
              <p className="text-sm md:text-default">
                {chapter.chapterContent.length} lectures -{" "}
                {calculateChapterTime(chapter)}
              </p>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"
                }`}
            >
              <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                {chapter.chapterContent.map((lecture, i) => (
                  <li key={i} className="flex items-center gap-2 py-1">
                    <img
                      src={isLectureCompleted(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon}
                      alt={isLectureCompleted(lecture.lectureId) ? "completed" : "play_icon"}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                      <p>{lecture.lectureTitle}</p>
                      <div className="flex gap-2">
                        <p
                          onClick={() =>
                            setPlayerData({
                              ...lecture,
                              chapter: index + 1,
                              lecture: i + 1,
                            })
                          }
                          className="text-blue-500 cursor-pointer"
                        >
                          {isLectureCompleted(lecture.lectureId) ? "Review" : "Watch"}
                        </p>

                        <p>
                          {humanizeDuration(
                            lecture.lectureDuration * 60 * 1000,
                            { units: ["h", "m"] }
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
    </div>
  )

  return courseData ? (
    <>
      <div className="p-4 sm:p-10 flex flex-col xl:grid xl:grid-cols-3 gap-10">
        {/* left column */}
        <div className="xl:col-span-2">
          {playerData ? (
            <div className="w-full min-h-96 md:h-[600px] lg:h-[600px]">
              <YouTube
                videoId={playerData.lectureUrl.split("/").pop().split("?")[0]}
                opts={youtubeOpts}
                onEnd={() => {
                  if (playerData && !isLectureCompleted(playerData.lectureId)) {
                    markLectureAsCompleted(playerData.lectureId);
                  } else {
                    advanceToNextLecture();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                <p>
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </p>
                <button onClick={() => markLectureAsCompleted(playerData.lectureId)} className="text-blue-600">
                  {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? "Completed" : "Mark Complete"}
                </button>
              </div>
            </div>
          ) : (
            courseData && <img src={courseData.courseThumbnail} alt="Course Thumbnail" />
          )}

          {/* Tabs */}
          <div className="mt-10">
            {/* Header Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { name: "Overview" },
                { name: "Course Content", className: "xl:hidden" },
                { name: "Q&A" },
                { name: "Reviews" },
              ]
                .map((tab) => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`py-2 px-6 text-sm font-semibold transition-colors duration-300 outline-none whitespace-nowrap ${tab.className}
                    ${activeTab === tab.name
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                      }
                  `}
                  >
                    {tab.name}
                  </button>
                ))}
            </div>

            {/* Nội dung Tabs */}
            <div className="py-6">
              {/* Tab Overview */}
              {activeTab === "Overview" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-bold mb-3">Course Description</h3>
                  <div
                    className="text-gray-600 leading-relaxed rich-text"
                    dangerouslySetInnerHTML={{ __html: courseData?.courseDescription }}
                  />
                  {!courseData?.courseDescription && (
                    <p className="text-gray-500 italic">No description available for this course.</p>
                  )}
                </div>
              )}

              {/* Tab Course Content */}
              {activeTab === "Course Content" && (
                <div className="animate-fadeIn xl:hidden">
                  {courseStructure}
                </div>
              )}

              {/* Tab Q&A */}
              {activeTab === "Q&A" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Q&A</h3>
                  {playerData ? (
                    <CourseQnA
                      lectureTitle={playerData.lectureTitle}
                      lectureIndex={`${playerData.chapter}.${playerData.lecture}`}
                    />
                  ) : (
                    <p className="text-gray-500">Select a lecture to view Q&A.</p>
                  )}
                </div>
              )}

              {/* Tab Reviews */}
              {activeTab === "Reviews" && (
                <div className="animate-fadeIn space-y-4">
                  <h3 className="text-xl font-bold">Student Reviews</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Rate this course:</span>
                    <Rating initialRating={initialRating} onRate={handleRate} />
                  </div>
                  {playerData ? (
                    <CourseQnA
                      lectureTitle={playerData.lectureTitle}
                      lectureIndex={`${playerData.chapter}.${playerData.lecture}`}
                    />
                  ) : (
                    <p className="text-gray-500">Select a lecture to view other reviews.</p>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* right column */}
        <div className="hidden xl:block xl:col-span-1">
          <h2 className="text-xl font-bold pb-4">Course content </h2>
          {courseStructure}
        </div>
      </div>

      <Footer />
    </>) : <Loading />;
};

export default Player;
