const { useState } = React;
const { useLocation, useHistory } = window.ReactRouterDOM;

export default function NewPoll({ user, setUser }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);

  const location = useLocation();
  const history = useHistory();

  const submitHandler = async (event) => {
    event.preventDefault();

    try {
      const { data } = await axios.post('/api/poll', { question, options, userId: user._id });
      const { from } = location.state || { from: { pathname: '/my-polls' } };

      setUser(data);
      history.replace(from);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <form className="main-form" onSubmit={submitHandler}>
      <h1>New Poll</h1>

      <div className="input-control">
        <label htmlFor="question">Question</label>
        <input type="text" name="question" id="question" onChange={(event) => setQuestion(event.target.value)} />
      </div>
      <div className="input-control">
        <label htmlFor="options">Options (Separated by commas)</label>
        <textarea
          name="options"
          id="options"
          cols="30"
          rows="10"
          onChange={(event) => setOptions(event.target.value.split(',').map((v) => ({ value: v.trim(), total: 0 })))}
        ></textarea>
      </div>

      <button type="submit" className="btn">
        Submit
      </button>
    </form>
  );
}
