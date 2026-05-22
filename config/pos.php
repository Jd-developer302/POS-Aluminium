<?php

return [

    /**
     * Initial password for the login user created with each new employee.
     * Override via .env: EMPLOYEE_USER_DEFAULT_PASSWORD
     * Users should change this after first login.
     */
    'employee_user_default_password' => env('EMPLOYEE_USER_DEFAULT_PASSWORD', '123456'),

];
