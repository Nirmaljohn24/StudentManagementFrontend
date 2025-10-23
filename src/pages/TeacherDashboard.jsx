import { useState, useEffect } from "react";
import api from "../api/axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [submissions, setSubmissions] = useState({});
  const [collapsedAssignments, setCollapsedAssignments] = useState({}); // Track expanded/collapsed

  // 🔹 Load assignments
  const fetchAssignments = async () => {
    try {
      const res = await api.get("/teacher/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 🔹 Create new assignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        "/teacher/assignments",
        { ...form, status: "Draft" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments((prev) => [res.data, ...prev]);
      setForm({ title: "", description: "", dueDate: "" });
      toast.success("Assignment created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create assignment");
    }
  };

  // 🔹 Change assignment status
  const changeStatus = async (id, status) => {
    try {
      const res = await api.patch(
        `/teacher/assignments/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: res.data.status } : a))
      );
      toast.success(`Status changed to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  // 🔹 Delete assignment
  const deleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/teacher/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast.success("Assignment deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete assignment");
    }
  };

  // 🔹 Fetch student submissions
  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await api.get(`/teacher/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions((prev) => ({ ...prev, [assignmentId]: res.data }));
    } catch (err) {
      console.error(err);
      toast.error("Error loading submissions");
    }
  };

  // 🔹 Toggle collapsed/expanded submissions
  const toggleCollapse = async (assignmentId) => {
    if (!collapsedAssignments[assignmentId]) {
      await fetchSubmissions(assignmentId);
    }
    setCollapsedAssignments((prev) => ({
      ...prev,
      [assignmentId]: !prev[assignmentId],
    }));
  };

  // 🔹 Mark submission as reviewed
  const markReviewed = async (assignmentId, submissionId) => {
    try {
      await api.patch(
        `/teacher/assignments/${assignmentId}/submissions/${submissionId}/review`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubmissions(assignmentId);
      toast.success("Marked as reviewed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as reviewed");
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  // 🔹 Status badge styles
  const getStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-200 text-gray-700";
      case "Published":
        return "bg-green-100 text-green-700";
      case "Completed":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <Toaster position="top-center" />

      
      <div className="bg-white shadow-md py-3 px-6 flex justify-between items-center sticky top-0">
        <h2 className="text-xl font-bold text-blue-700">Teacher Dashboard</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{user?.email}</span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6 space-y-10">
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Assignment</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="border p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="border p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <input
              type="date"
              className="border p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-400"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Create
            </button>
          </form>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assignments.map((a) => (
            <div
              key={a._id}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition"
            >
              <h3 className="text-lg font-bold mb-1">{a.title}</h3>
              <p className="text-gray-700">{a.description}</p>
              <p className="text-sm text-gray-500">
                Due: {new Date(a.dueDate).toLocaleDateString()}
              </p>

              <span
                className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(
                  a.status
                )}`}
              >
                {a.status}
              </span>

              <div className="mt-3 flex flex-wrap gap-2">
                
                {a.status === "Draft" && (
                  <>
                    <button
                      onClick={() => changeStatus(a._id, "Published")}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => deleteAssignment(a._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}

                
                {a.status === "Published" && (
                  <button
                    onClick={() => changeStatus(a._id, "Completed")}
                    className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                  >
                    Mark Completed
                  </button>
                )}

               
                {a.status === "Completed" && (
                  <span className="text-gray-500 text-sm px-2 py-1 rounded border border-gray-300">
                    Locked
                  </span>
                )}

                
                <button
                  onClick={() => toggleCollapse(a._id)}
                  className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                >
                  {collapsedAssignments[a._id] ? "Hide Submissions" : "View Submissions"}
                </button>
              </div>

              
              {collapsedAssignments[a._id] && submissions[a._id] && (
                <div className="mt-4 border-t pt-3 overflow-hidden transition-all duration-300 ease-in-out">
                  <h4 className="font-semibold mb-2">Student Submissions:</h4>
                  {submissions[a._id].length === 0 ? (
                    <p className="text-gray-500 text-sm">No submissions yet.</p>
                  ) : (
                    submissions[a._id].map((s) => (
                      <div
                        key={s._id}
                        className="border p-3 rounded-lg mb-2 bg-gray-50"
                      >
                        <p>
                          <strong>Student:</strong> {s.studentEmail}
                        </p>
                        <p>
                          <strong>Answer:</strong> {s.answer}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(s.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1">
                          <strong>Status:</strong>{" "}
                          {s.reviewed ? (
                            <span className="text-green-600">Reviewed ✅</span>
                          ) : (
                            <button
                              onClick={() => markReviewed(a._id, s._id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Mark Reviewed
                            </button>
                          )}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
