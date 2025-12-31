import React, { useState, useEffect, useContext } from "react";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import { validateInput } from "../../utils/securityValidation";

const CourseQnA = ({ lectureTitle, lectureIndex, lectureId, courseId }) => {
  const { backendURL, getToken, requireAuth, userData } = useContext(AppContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      if (!lectureId) return;
      try {
        const { data } = await axios.get(`${backendURL}/comment/${lectureId}`);
        if (data.success) {
          setComments(data.comments || []);
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchComments();
  }, [lectureId, backendURL]);

  const handleSubmit = async () => {
    if (!requireAuth()) return;

    // Validate input
    const validation = validateInput(newComment, 500);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/comment/add`,
        { courseId, lectureId, text: validation.sanitized },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setComments((prev) => [data.comment, ...(prev || [])]);
        setNewComment("");
        toast.success("Comment submitted successfully");
      } else {
        toast.error(data.message || "Failed to submit comment");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white font-bold">
          <img src={userData?.imageUrl} alt="user_icon" className="w-10 h-10 rounded-full object-cover"  />
        </div>
        <div className="flex-1">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition resize-none"
            rows="3"
            placeholder="Comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
          ></textarea>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {newComment.length}/500 characters
            </span>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newComment.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {comments.map((item) => (
          <div key={item.id || item._id} className="flex gap-4 items-start">
            {item.userId?.imageUrl || item.avatar ? (
              <img src={item.userId?.imageUrl || item.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                {(item.userId?.name || item.user || "U").charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-800">{item.userId?.name || item.user || "Học viên"}</h4>
                <span className="text-xs text-gray-500">• {item.timestamp || new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default CourseQnA;