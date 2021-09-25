const { useEffect, useState } = React;
const { useLocation, useHistory } = window.ReactRouterDOM;

export default function MyPolls({ user, setUser }) {
  const [polls, setPolls] = useState(null);

  const location = useLocation();
  const history = useHistory();

  const deleteHandler = async (pollId) => {
    try {
      const { data } = await axios.delete('/api/poll', { data: { pollId, userId: user._id } });
      setPolls((polls) => polls.filter((poll) => poll._id !== pollId));
      setUser(data);
    } catch (error) {
      console.log(error);
    }
  };

  const shareHandler = (pollId) => {
    const { from } = location.state || { from: { pathname: `/share/${pollId}` } };
    history.push(from);
  };

  useEffect(() => {
    const getPolls = async () => {
      try {
        const { data } = await axios.get('/api/poll', { params: { userId: user._id } });
        setPolls(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!polls) {
      getPolls();
    }
  }, [polls]);

  return (
    polls && (
      <React.Fragment>
        <h1>My Polls</h1>
        <ul className="polls">
          {polls.length ? (
            polls.map((poll) => (
              <li key={poll._id}>
                <h2>{poll.question}</h2>
                {poll.options.map((option) => (
                  <p key={option.value}>
                    <strong>{option.value}</strong>: {option.total}
                  </p>
                ))}

                <div>
                  <button type="button" className="btn btn-danger" onClick={() => deleteHandler(poll._id)}>
                    Delete
                  </button>
                  <button type="button" className="btn" onClick={() => shareHandler(poll._id)}>
                    Share
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p>You have no polls currently</p>
          )}
        </ul>
      </React.Fragment>
    )
  );
}
