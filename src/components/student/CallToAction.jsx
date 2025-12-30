import React from 'react'
import { assets } from '../../assets/assets'
import { useClerk } from '@clerk/clerk-react';

const CallToAction = () => {
  const { openSignIn } = useClerk();


  return (
    <div className='flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0'>
      <h1 className='text-xl md:text-4xl text-gray-800 font-semibold'>Learn anything, anytime, anywhere</h1>
      <p className='text-gray-500 sm:text-sm'>Start your learning journey today with our vast library of on-demand courses, accessible whenever and wherever you are.</p>
      <div className='flex items-center font-medium gap-6 mt-4'>
        <button  onClick={openSignIn} className='px-10 py-3 rounded-md text-white bg-blue-600'>Get started</button>
        <button onClick={() => window.scrollTo(0, 0)} className='flex items-center gap-2 px-10 py-3'>Learn more <img src={assets.arrow_icon} alt='arrow_icon'/></button>
      </div>
    </div>
  )
}

export default CallToAction