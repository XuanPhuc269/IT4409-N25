import React, { useState, useEffect } from "react";
import { assets } from "../../assets/assets";

const CourseQnA = ({ lectureTitle, lectureIndex }) => {
  const [comments, setComments] = useState([
    {
      id: 1,
      user: "Nguyễn Văn A",
      avatar: "",
      text: "Bài giảng này rất hay, nhưng phút thứ 5:30 mình chưa hiểu lắm.",
      timestamp: "2 giờ trước",
    },
    {
      id: 2,
      user: "Trần Thị B",
      avatar: "",
      text: "Cảm ơn thầy, giọng đọc rất dễ nghe!",
      timestamp: "1 ngày trước",
    },
  ]);

  const [newComment, setNewComment] = useState("");
  useEffect(() => {
  }, [lectureIndex]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const commentObj = {
      id: Date.now(),
      user: "Bạn (Học viên)",
      avatar: "", 
      text: newComment,
      timestamp: "Vừa xong",
    };

    setComments([commentObj, ...comments]);
    setNewComment("");
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Q&A</h3>

      <div className="flex gap-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white font-bold">
           User
        </div>
        <div className="flex-1">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition resize-none"
            rows="3"
            placeholder="Comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <div className="mt-2 flex justify-end">
            <button 
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((item) => (
          <div key={item.id} className="flex gap-4 items-start">
            {item.avatar ? (
                <img src={item.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    {item.user.charAt(0)}
                </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-800">{item.user}</h4>
                <span className="text-xs text-gray-500">• {item.timestamp}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseQnA;