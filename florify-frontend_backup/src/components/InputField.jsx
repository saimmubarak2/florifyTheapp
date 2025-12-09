import React from 'react';

const InputField = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  onKeyPress
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      className="input-field"
    />
  );
};

export default InputField;