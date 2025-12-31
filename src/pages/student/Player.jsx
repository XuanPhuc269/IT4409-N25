import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { validateInput } from "../../utils/securityValidation";

const Player = () => {
  const { enrolledCourses, calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNumberOfLectures,
    currency, getToken, userData, setUserData, fetchUserEnrolledCourses, requireAuth, backendURL } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const inFlightRef = useRef(false);
  const ratingInFlightRef = useRef(false);

  // FIX: declare missing refs/states for the YouTube player
  const playerRef = useRef(null);
  const playbackIntervalRef = useRef(null);
  const [initializedPlayer, setInitializedPlayer] = useState(false);
  // Add selected rating + review text state
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings.map((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating);
            setSelectedRating(item.rating);
            setReviewText(item.review || "");
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

  // Local cache helpers
  const progressCacheKey = `${userData ? userData._id : 'anonymous'}:progress:${courseId}`;
  const playbackCacheKey = `${userData ? userData._id : 'anonymous'}:playback:${courseId}`;

  const loadCachedProgress = () => {
    try {
      const raw = localStorage.getItem(progressCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveCachedProgress = (progress) => {
    try {
      localStorage.setItem(progressCacheKey, JSON.stringify(progress));
    } catch {}
  };

  const loadCachedPlayback = () => {
    try {
      const raw = localStorage.getItem(playbackCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveCachedPlayback = (payload) => {
    try {
      localStorage.setItem(playbackCacheKey, JSON.stringify(payload));
    } catch {}
  };

  useEffect(() => {
    if (!courseId) return;
    const cached = loadCachedProgress();
    if (cached) {
      setProgressData(cached);
    }
    if (userData) {
      getCourseProgress();
    }
  }, [userData, courseId]);

  useEffect(() => {
    if (!courseData || !courseId) return;

    if (playerData) return;

    const cached = loadCachedPlayback();

    const chapters = courseData.courseContent || [];
    if (!chapters.length) return;

    if (cached && cached.lectureId) {
      for (let ci = 0; ci < chapters.length; ci++) {
        const ch = chapters[ci];
        const lectures = ch.chapterContent || [];
        for (let li = 0; li < lectures.length; li++) {
          const lec = lectures[li];
          if (String(lec.lectureId).trim() === String(cached.lectureId).trim()) {
            setPlayerData({ ...lec, chapter: ci + 1, lecture: li + 1 });
            return;
          }
        }
      }
    }

    const firstChapter = chapters[0];
    if (firstChapter && firstChapter.chapterContent && firstChapter.chapterContent.length > 0) {
      const firstLecture = firstChapter.chapterContent[0];
      setPlayerData({ ...firstLecture, chapter: 1, lecture: 1 });
    }
  }, [courseData, courseId]);

  const markLectureAsCompleted = async (lectureId) => {
    const originalId = lectureId; // giữ nguyên ID để khớp DB
    if (isLectureCompleted(originalId) || inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      const currentProgress = progressData;

      setProgressData((prev) => {
        const completed = new Set((prev?.lectureCompleted || []).map((x) => String(x)));
        completed.add(String(originalId));
        const next = { ...(prev || { courseId, lectureCompleted: [] }), lectureCompleted: Array.from(completed) };
        saveCachedProgress(next);
        return next;
      });

      advanceToNextLecture();

      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/user/update-course-progress`,
        { courseId, lectureId: originalId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        setProgressData(currentProgress);
        if (currentProgress) saveCachedProgress(currentProgress);
        toast.error(data.message);
      } else {
        data.userData && setUserData(data.userData);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      inFlightRef.current = false;
    }
  };

  const getCourseProgress = async () => {
    if (!userData) return;
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/user/get-course-progress`, { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        const server = data.progressData || { courseId, lectureCompleted: [] };
        const cached = loadCachedProgress();

        const mergedRaw = Array.from(new Set([
          ...((server.lectureCompleted || []).map((x) => String(x))),
          ...(((cached?.lectureCompleted) || []).map((x) => String(x))),
        ]));

        const merged = { courseId, lectureCompleted: mergedRaw };
        setProgressData(merged);
        saveCachedProgress(merged);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const isLectureCompleted = (lectureId) => {
    const idTrimmed = String(lectureId).trim();
    const completed = (progressData?.lectureCompleted || []).map((x) => String(x).trim());
    return completed.includes(idTrimmed);
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

  const handleSubmitReview = async () => {
    if (!requireAuth() || ratingInFlightRef.current) return;
    
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      toast.error("Please select a rating between 1 and 5.");
      return;
    }

    // Validate review text if provided
    if (reviewText.trim()) {
      const validation = validateInput(reviewText, 1000);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
    }

    ratingInFlightRef.current = true;
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/user/add-rating`,
        { 
          courseId, 
          rating: Number(selectedRating), 
          review: reviewText.trim() 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setInitialRating(Number(selectedRating));
        setCourseData(prev => {
          if (!prev) return prev;
          const nextRatings = (prev.courseRatings || []).filter(r => r.userId !== userData._id);
          nextRatings.push({ 
            userId: userData._id, 
            rating: Number(selectedRating), 
            review: reviewText.trim() 
          });
          return { ...prev, courseRatings: nextRatings };
        });
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      ratingInFlightRef.current = false;
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

  const handleStateChange = (event) => {
    const state = event.data; // -1: unstarted, 0: ended, 1: playing, 2: paused
    const player = event.target;
    if (state === 1) {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = setInterval(() => {
        try {
          const seconds = player.getCurrentTime();
          if (playerData && seconds != null) {
            saveCachedPlayback({
              courseId,
              lectureId: playerData.lectureId,
              seconds: Math.floor(seconds),
            });
          }
        } catch {}
      }, 3000);
    } else if (state === 2) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
      try {
        const seconds = player.getCurrentTime();
        if (playerData && seconds != null) {
          saveCachedPlayback({
            courseId,
            lectureId: playerData.lectureId,
            seconds: Math.floor(seconds),
          });
        }
      } catch {}
    } else if (state === 0) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }
  };

  const handleReady = (event) => {
    playerRef.current = event.target;
    const cached = loadCachedPlayback();
    if (!cached || !playerData) return;
    try {
      if (String(cached.lectureId).trim() === String(playerData.lectureId).trim()) {
        if (typeof cached.seconds === 'number' && cached.seconds > 0) {
          event.target.seekTo(cached.seconds, true);
        }
      }
    } catch {}
    setInitializedPlayer(true);
  };

  // Seek when playerData changes and player is already ready
  useEffect(() => {
    if (!playerRef.current || !playerData) return;
    const cached = loadCachedPlayback();
    if (cached && String(cached.lectureId).trim() === String(playerData.lectureId).trim()) {
      try {
        if (typeof cached.seconds === 'number' && cached.seconds > 0) {
          playerRef.current.seekTo(cached.seconds, true);
        }
      } catch {}
    }
  }, [playerData]);

  // Cleanup playback interval and playerRef on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
      playerRef.current = null;
    };
  }, []);

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
            <div>
              <div className="w-full min-h-96 md:h-[600px] lg:h-[600px]">
                <YouTube
                  videoId={playerData.lectureUrl.split("/").pop().split("?")[0]}
                  opts={youtubeOpts}
                  onReady={handleReady}
                  onStateChange={handleStateChange}
                  onEnd={() => {
                    if (playerData && !isLectureCompleted(playerData.lectureId)) {
                      markLectureAsCompleted(playerData.lectureId);
                    } else {
                      advanceToNextLecture();
                    }
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-800">
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </h3>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className={`px-4 py-2 rounded-md font-semibold text-white transition-colors ${isLectureCompleted(playerData.lectureId)
                      ? "bg-green-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  disabled={isLectureCompleted(playerData.lectureId)}
                >
                  {isLectureCompleted(playerData.lectureId)
                    ? "Completed"
                    : "Mark as Complete"}
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
                      lectureId={playerData.lectureId}
                      courseId={courseId}
                    />
                  ) : (
                    <p className="text-gray-500">Select a lecture to view Q&A.</p>
                  )}
                </div>
              )}

              {/* Tab Reviews */}
              {activeTab === "Reviews" && (
                <div className="animate-fadeIn space-y-6">
                  <h3 className="text-xl font-bold">Student Reviews</h3>

                  <div className="text-gray-700">
                    <span className="font-medium">Average:</span> {calculateRating(courseData)} / 5
                    <span className="mx-2">•</span>
                    <span className="font-medium">Total reviews:</span> {courseData.courseRatings.length}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">Rate this course:</span>
                      <Rating initialRating={selectedRating} onRate={setSelectedRating} />
                    </div>
                  </div>

                  <div>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition resize-none"
                      rows="3"
                      placeholder="Write your review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={1000}
                    ></textarea>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {reviewText.length}/1000 characters
                      </span>
                      <button
                        onClick={handleSubmitReview}
                        className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedRating}
                      >
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Reviews list */}
                  <div className="space-y-4">
                    {courseData.courseRatings.length === 0 && (
                      <p className="text-gray-500">No reviews yet.</p>
                    )}
                    {courseData.courseRatings.map((r, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {r.userId === userData?._id ? "You" : r.userId}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <img
                                key={i}
                                src={i < Math.floor(r.rating) ? assets.star : assets.star_blank}
                                alt="star"
                                className="w-3.5 h-3.5"
                              />
                            ))}
                          </div>
                        </div>
                        {r.review && (
                          <p className="mt-2 text-gray-700 text-sm">{r.review}</p>
                        )}
                      </div>
                    ))}
                  </div>
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
