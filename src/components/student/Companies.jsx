import React from 'react'
import hust_logo from '../../assets/hust_logo.png'
import microsoft_logo from '../../assets/microsoft_logo.png'
import paypal_logo from '../../assets/paypal_logo.png'

const Companies = () => {
  return (
    <div className='pt-16'>
      <p className='test-base text-gray-500'>Trusted by learners from</p>
      <div className='flex flex-wrap items-center justify-center gap-6 md:gap-16 md:mt-10 mt-5'>
        <img src={hust_logo} alt='Hust' className='w-20 md:w-35'/>
        <img src={microsoft_logo} alt='Hust' className='w-20 md:w-35'/>
        <img src={paypal_logo} alt='Hust' className='w-20 md:w-35'/>
      </div>
    </div>
  )
}

export default Companies