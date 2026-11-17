import type { Feedback } from "../../hooks/useFeedback";

export default function Messages({
  error,
  notice,
  setError,
  setNotice,
}: Feedback) {
  return (
    <>
      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Request issue:</strong> {error}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          />
        </div>
      )}

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          />
        </div>
      )}
    </>
  );
}
