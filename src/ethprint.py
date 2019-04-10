import os
import subprocess
from threading import Timer, Thread

"""
Important Information
=====================

The following two system commands are required:
- smbclient
- pdftops (included in the poppler-utils package)
"""

SMB_SERVER = '//piastud01.d.ethz.ch/card-stud'
MAX_JOB_TIME = 60  # time in seconds after the print job is aborted
TMP_PS_FILES = '/tmp'


def start_job(nethz, password, exam, pdf_path):
    """
    Starts a new job to send a PDF to the printer.
    Returns 0 on success, 1 otherwise.
    """

    username = _prepare_username(nethz)

    # Test authentication
    if _check_smb_connection(username, password):
        return 1

    # Start print job
    job = Thread(target=_print_pdf, args=(username, password, exam, pdf_path), kwargs={})
    job.start()

    return 0


def _prepare_username(nethz):
    """
    Appends a suffix to the nethz account required by samba.
    e.g. hansli -> d\hansli
    """

    return u'd\\{nethz}'.format(nethz=nethz)


def _check_smb_connection(username, password):
    """
    Tests whether the user may connect to the samba printer server.
    The return code is 0 if the user passes authentication, 1 otherwise.
    """

    DEVNULL = open(os.devnull, 'w')
    return subprocess.call([
        'smbclient',
        u'{smb_server}'.format(smb_server=SMB_SERVER),
        '-c',
        'exit',
        u'--user={username}%{password}'.format(username=username, password=password),
    ], stderr=subprocess.STDOUT, close_fds=True) # stdout=DEVNULL,


def _print_pdf(username, password, exam, pdf_path):
    """
    Sends a PDF to the student print queue using the samba printer interface.
    Raises an exception if the job is killed after a maximum execution time.
    """

    # Generate the PostScript file
    ps_path = _generate_ps(exam, pdf_path)
    if not ps_path:
        return 1

    # Send the PS file to the smb print queue
    DEVNULL = open(os.devnull, 'w')
    proc = subprocess.Popen([
        'smbclient',
        u'{smb_server}'.format(smb_server=SMB_SERVER),
        '-c',
        u'print "{ps_path}"'.format(ps_path=ps_path),
        u'--user={username}%{password}'.format(username=username, password=password),
    ], stdout=DEVNULL, stderr=subprocess.STDOUT, close_fds=True)

    # Start timer to monitor the process
    timer = Timer(MAX_JOB_TIME, proc.kill)
    timer.start()
    proc.communicate()
    if timer.is_alive():
        # Process finished
        timer.cancel()
        return proc.returncode

    # Process killed by timer
    raise Exception(
        u'Print Job with process #{proc_id} killed after {max_time} seconds: Timeout reached.'.format(proc_id=proc.pid,
                                                                                                      max_time=MAX_JOB_TIME))


def _generate_ps(exam, pdf_path):
    """
    Converts a PDF to a PostScript file such that it can be printed.
    If the PostScript file already exists, no conversion is performed.
    Returns the path to the PostScript file, or None if an error occurs.
    """

    # Get the PS file path
    ps_path = os.path.join(TMP_PS_FILES, exam + '.ps')

    # Check if the PS file already exists
    if os.path.isfile(ps_path):
        # No conversion needs to be performed
        return ps_path

    # Convert the PDF file into a PS file
    DEVNULL = open(os.devnull, 'w')
    return_code = subprocess.call([
        'pdftops',
        '-paper',
        'A4',
        '-duplex',
        u'{pdf_path}'.format(pdf_path=pdf_path),
        u'{ps_path}'.format(ps_path=ps_path),
    ], stdout=DEVNULL, stderr=subprocess.STDOUT, close_fds=True)
    if return_code:
        # Error occured during pdftops command
        return None

    return ps_path
