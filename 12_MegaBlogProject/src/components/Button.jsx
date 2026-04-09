
function Button({
    children,                               //The text passed will be the childrens in the current case
    textColor='text-white',
    bgColor='bg-blue-600',
    type='button',
    className='',
    ...props
}) {
    return (
        <button className={`px-4 py-2 rounded-lg ${bgColor} ${className} ${textColor}`} {...props}>
            {children}
        </button>
    )
}

export default Button
