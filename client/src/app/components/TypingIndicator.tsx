import { useTypingIndicator } from "../hooks/useTypingIndicator";

const TypingIndicator = () => {
  const typingUsers = useTypingIndicator();
  if (!typingUsers.length) return;
  
  return (
    <div>
      {typingUsers.length === 1 && `${typingUsers[0].name} is typing...`}
      {typingUsers.length > 1 && "Multiple users typing..."}
    </div>
  );
};

export default TypingIndicator;
