import { useState, useEffect } from "react";
import api from "../api/axios";
import { Toaster, toast } from "react-hot-toast";

export default function StudentDashboard() {
  const token = localStorage.getItem("token");
  const [assignments, setAssignments] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({}); // to store submitted answers

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/student/assignments", { headers: { Authorization: `Bearer ${token}` } });
      setAssignments(res.data);

      // Fetch previous submissions
      const subsRes = await api.get("/student/submissions", { headers: { Authorization: `Bearer ${token}` } });
      const subsMap = {};
      subsRes.data.forEach(sub => subsMap[sub.assignment._id] = sub.answer);
      setSubmitted(subsMap);
    } catch (err) {
      toast.error("Failed to load assignments");
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (assignmentId) => {
    try {
      const res = await api.post(`/student/assignments/${assignmentId}/submit`, { answer: answers[assignmentId] }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Answer submitted!");
      setSubmitted(prev => ({ ...prev, [assignmentId]: res.data.answer }));
      setAnswers(prev => ({ ...prev, [assignmentId]: "" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <Toaster position="top-center" />
      <nav className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {assignments.length === 0 ? <p>No published assignments yet.</p> : assignments.map(a => (
          <div key={a._id} className="bg-white shadow-md rounded-xl p-5">
            <h2 className="text-lg font-bold">{a.title}</h2>
            <p>{a.description}</p>
            <p className="text-sm text-gray-500">Due: {new Date(a.dueDate).toLocaleDateString()}</p>

            {submitted[a._id] ? (
              <p className="mt-2 p-2 bg-gray-100 rounded">Your Answer: {submitted[a._id]}</p>
            ) : (
              <>
                <textarea
                  placeholder="Enter your answer..."
                  className="w-full border p-2 mt-3 rounded-lg"
                  value={answers[a._id] || ""}
                  onChange={e => setAnswers({ ...answers, [a._id]: e.target.value })}
                ></textarea>
                <button onClick={() => handleSubmit(a._id)} className="bg-blue-600 text-white px-4 py-2 mt-2 rounded">Submit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
